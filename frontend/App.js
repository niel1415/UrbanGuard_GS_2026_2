import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { api, normalizeHost, wsUrl, httpBase } from './src/net';
const { sortEvents, filterEvents, riskColor, labelType, labelSource } = require('./src/utils.cjs');

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: false, shouldSetBadge: false }),
});

const C = { navy: '#101D36', navy2: '#1B3155', bg: '#F3F6FA', white: '#FFFFFF',
  text: '#17243D', muted: '#687891', border: '#E3E8F0', blue: '#2D70E0', mint: '#278C71' };
const typeIcon = { FLOOD: '🌧️', HEAT: '🌡️', SERVICE: '⚡' };
const tabs = [
  ['home', '⌂', 'Painel'], ['events', '▤', 'Eventos'],
  ['alerts', '◉', 'Alertas'], ['report', '+', 'Relatar'], ['settings', '⚙', 'Conexão']
];
function Mini({ children, color = C.muted, style }) {
  return <Text style={[{ color, fontSize: 12, lineHeight: 17 }, style]}>{children}</Text>;
}
function Button({ children, onPress, secondary = false, disabled = false, style }) {
  return <TouchableOpacity activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={String(children)}
    onPress={onPress} disabled={disabled} style={[s.button, secondary && s.secondaryButton, disabled && { opacity: .52 }, style]}>
    <Text style={[s.buttonLabel, secondary && { color: C.blue }]}>{children}</Text>
  </TouchableOpacity>;
}
function Chip({ children, active, onPress }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: active }}
    onPress={onPress} style={[s.chip, active && { backgroundColor: C.navy2, borderColor: C.navy2 }]}>
    <Text style={[s.chipText, active && { color: '#fff' }]}>{children}</Text>
  </TouchableOpacity>;
}
function SectionTitle({ children, right }) {
  return <View style={s.sectionTitle}><Text style={s.sectionText}>{children}</Text>{right || null}</View>;
}
function StatusPill({ state }) {
  const statuses = {
    online: ['● AO VIVO', '#B9F5D7'], partial: ['◐ API ATIVA', '#FFDEAC'],
    connecting: ['◌ CONECTANDO', '#E6EAF2'], offline: ['● SEM CONEXÃO', '#FFC3CA']
  };
  const [label, color] = statuses[state];
  return <View style={[s.statusPill, { borderColor: color + '66' }]}>
    <Text style={{ color, fontWeight: '800', fontSize: 10 }}>{label}</Text>
  </View>;
}
function EventCard({ event }) {
  const accent = riskColor(event.priorityScore);
  const percent = Math.round(event.confidence * 100);
  const time = event.createdAt ? new Date(event.createdAt).toLocaleString('pt-BR',
    { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
  return <View style={s.eventCard} accessible accessibilityLabel={`${labelType(event.eventType)}: ${event.title}. Risco ${event.priorityScore} de 100.`}>
    <View style={s.eventRow}>
      <View style={[s.eventIcon, { backgroundColor: accent + '16' }]}><Text style={{ fontSize: 22 }}>{typeIcon[event.eventType] || '📍'}</Text></View>
      <View style={{ flex: 1 }}><Mini style={{ fontWeight: '700' }}>{labelType(event.eventType)} · {event.neighborhood}</Mini>
        <Text style={s.eventTitle}>{event.title}</Text>
      </View>
      <View style={[s.scoreBadge, { backgroundColor: accent }]}><Text style={s.scoreBadgeText}>{event.priorityScore}</Text></View>
    </View>
    <Text style={s.eventDesc}>{event.description}</Text>
    <View style={s.eventSeparator} />
    <View style={s.eventFooter}>
      <Mini><Text style={{ fontWeight: '700', color: accent }}>{event.priorityLevel}</Text> · {event.city}</Mini>
      <Mini>{time}</Mini>
    </View>
    <View style={[s.eventFooter, { marginTop: 6 }]}> 
      <Mini>Origem: {labelSource(event.sourceType)} · {event.origin}</Mini>
    </View>
    <Mini style={{ marginTop: 5 }}>Confiança: {percent}% · Gravidade: {event.severity}/5 · Impacto: {event.impactLevel}/5</Mini>
  </View>;
}
function Blank({ icon, title, explanation }) {
  return <View style={s.empty}><Text style={{ fontSize: 34 }}>{icon}</Text>
    <Text style={[s.sectionText, { textAlign: 'center', marginTop: 10 }]}>{title}</Text>
    <Mini style={{ textAlign: 'center', marginTop: 6 }}>{explanation}</Mini>
  </View>;
}
function Field({ label, value, onChangeText, placeholder, multiline = false }) {
  return <View style={{ marginBottom: 13 }}><Text style={s.fieldLabel}>{label}</Text>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText}
      placeholder={placeholder} placeholderTextColor="#8895A8" multiline={multiline}
      style={[s.input, multiline && { height: 92, textAlignVertical: 'top' }]}
      autoCapitalize={label.includes('IP') ? 'none' : 'sentences'} />
  </View>;
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [host, setHost] = useState(Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  const [hostInput, setHostInput] = useState(host);
  const [retry, setRetry] = useState(0);
  const [connection, setConnection] = useState('connecting');
  const [events, setEvents] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [newAlert, setNewAlert] = useState(null);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState('TODOS');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [deviceNotifs, setDeviceNotifs] = useState(false);
  const notifsEnabled = useRef(false);
  const seenIds = useRef(new Set());
  const loadedBefore = useRef(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportPlace, setReportPlace] = useState('');
  const [reportType, setReportType] = useState('FLOOD');
  const [reportSeverity, setReportSeverity] = useState(3);

  const sendAlert = useCallback((event) => {
    if (event.priorityScore < 60) return;
    setNewAlert(event);
    setUnread(prev => prev + 1);
    if (notifsEnabled.current && Platform.OS !== 'web') {
      Notifications.scheduleNotificationAsync({
        content: { title: `UrbanGuard · ${event.priorityLevel}`, body: `${event.title} | ${event.neighborhood}`,
          data: { eventId: event.id } }, trigger: null,
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let reconnectTimer = null;
    let socket = null;
    let socketOpen = false;
    let requestInProgress = false;
    seenIds.current = new Set();
    loadedBefore.current = false;
    setEvents([]);
    setDashboard(null);
    setConnection('connecting');
    setNewAlert(null);

    async function refresh() {
      if (requestInProgress || disposed) return;
      requestInProgress = true;
      try {
        const [items, stats] = await Promise.all([api(host, '/api/events'), api(host, '/api/dashboard')]);
        if (disposed) return;
        const sorted = sortEvents(items);
        if (loadedBefore.current) {
          const unseen = sorted.find(item => !seenIds.current.has(item.id) && item.priorityScore >= 60);
          if (unseen) sendAlert(unseen);
        }
        sorted.forEach(item => seenIds.current.add(item.id));
        loadedBefore.current = true;
        setEvents(sorted);
        setDashboard(stats);
        setConnection(socketOpen ? 'online' : 'partial');
      } catch (_) {
        if (!disposed) setConnection(socketOpen ? 'online' : 'offline');
      } finally { requestInProgress = false; }
    }

    function connect() {
      if (disposed) return;
      try {
        socket = new WebSocket(wsUrl(host));
        socket.onopen = () => {
          if (disposed) return;
          socketOpen = true;
          setConnection('online');
          refresh();
        };
        socket.onmessage = msg => {
          if (disposed) return;
          try {
            const payload = JSON.parse(msg.data);
            if (payload.type !== 'EVENT_CREATED' || !payload.event) return;
            const event = payload.event;
            if (!seenIds.current.has(event.id)) {
              seenIds.current.add(event.id);
              if (loadedBefore.current) sendAlert(event);
            }
            setEvents(current => sortEvents([event, ...current.filter(e => e.id !== event.id)]));
            api(host, '/api/dashboard').then(data => { if (!disposed) setDashboard(data); }).catch(() => {});
          } catch (_) { /* uma mensagem malformada não deve derrubar o app */ }
        };
        socket.onerror = () => { if (!disposed) setConnection('offline'); };
        socket.onclose = () => {
          if (disposed) return;
          socketOpen = false;
          setConnection('offline');
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (_) {
        socketOpen = false;
        setConnection('offline');
        reconnectTimer = setTimeout(connect, 3000);
      }
    }
    refresh();
    connect();
    const pollTimer = setInterval(refresh, 8000); // fallback e disponibilidade
    return () => {
      disposed = true;
      clearInterval(pollTimer);
      clearTimeout(reconnectTimer);
      try { socket?.close(); } catch (_) { }
    };
  }, [host, retry, sendAlert]);

  const critical = useMemo(() => events.filter(e => e.priorityScore >= 80), [events]);
  const alerts = useMemo(() => events.filter(e => e.priorityScore >= 60), [events]);
  const visible = useMemo(() => filterEvents(events, filter), [events, filter]);
  const maxScore = dashboard?.maximumRiskScore ?? (events[0]?.priorityScore || 0);
  const isOffline = connection === 'offline' || connection === 'connecting';

  async function simulate() {
    setBusy(true); setNotice('');
    try {
      const created = await api(host, '/api/demo/simulate', 'POST');
      setNotice(`Novo evento enviado: ${created.title}`);
    } catch (error) { setNotice('Não foi possível simular: ' + error.message); }
    finally { setBusy(false); }
  }

  async function submitReport() {
    if (reportTitle.trim().length < 4 || reportDesc.trim().length < 8 || reportPlace.trim().length < 3) {
      Alert.alert('Campos incompletos', 'Preencha título (4+), descrição (8+) e bairro (3+).');
      return;
    }
    setBusy(true); setNotice('');
    try {
      await api(host, '/api/events', 'POST', {
        eventType: reportType, title: reportTitle.trim(), description: reportDesc.trim(),
        neighborhood: reportPlace.trim(), city: 'Região informada',
        sourceType: 'COMMUNITY', origin: 'Relato comunitário anônimo',
        confidence: 0.65, severity: reportSeverity, impactLevel: Math.max(1, reportSeverity - 1)
      });
      setReportTitle(''); setReportDesc(''); setReportPlace(''); setTab('events');
      setNotice('Relato recebido e analisado pela plataforma.');
    } catch (error) { setNotice('Falha ao enviar: ' + error.message); }
    finally { setBusy(false); }
  }

  async function enableDeviceNotifications() {
    if (Platform.OS === 'web') { Alert.alert('Disponível no celular', 'As notificações do aparelho exigem Android ou iOS.'); return; }
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('riscos', {
          name: 'Alertas UrbanGuard', importance: Notifications.AndroidImportance.HIGH
        });
      }
      const permission = await Notifications.requestPermissionsAsync();
      const enabled = permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      notifsEnabled.current = enabled;
      setDeviceNotifs(enabled);
      if (!enabled) Alert.alert('Notificações bloqueadas', 'O painel de alertas continuará funcionando normalmente.');
    } catch (_) { Alert.alert('Indisponível', 'Use o painel de alertas do aplicativo.'); }
  }

  function changeHost() {
    const cleaned = normalizeHost(hostInput);
    if (!cleaned || !/^[a-zA-Z0-9.\-]+$/.test(cleaned)) {
      Alert.alert('Endereço inválido', 'Digite apenas o IP local do computador, ex.: 192.168.1.10');
      return;
    }
    setHost(cleaned); setRetry(n => n + 1); setTab('home'); setNotice('Tentando conectar em ' + cleaned + ':8080');
  }

  function Home() {
    return <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.hero}>
        <Mini color="#BAC9E5" style={{ letterSpacing: 1, fontWeight: '800' }}>INTELIGÊNCIA DE RISCO URBANO</Mini>
        <Text style={s.heroTitle}>Sua cidade, sob atenção.</Text>
        <Text style={s.heroDesc}>Dados de sensores, fontes públicas e moradores em uma visão clara de prioridade.</Text>
        <View style={s.heroBottom}>
          <View><Mini color="#BDCCEA">ÍNDICE MÁXIMO DE RISCO</Mini>
            <Text style={s.heroNumber}>{maxScore}<Text style={{ fontSize: 17, color: '#CAD7ED' }}> /100</Text></Text></View>
          <Text style={{ fontSize: 34 }}>{maxScore >= 80 ? '🚨' : '🛡️'}</Text>
        </View>
      </View>
      <View style={s.statsRow}>
        <View style={s.stat}><Text style={[s.statValue, { color: '#D4314C' }]}>{dashboard?.criticalAlerts ?? '–'}</Text><Mini>Críticos</Mini></View>
        <View style={s.stat}><Text style={[s.statValue, { color: '#E88628' }]}>{dashboard?.highAlerts ?? '–'}</Text><Mini>Altos</Mini></View>
        <View style={s.stat}><Text style={s.statValue}>{dashboard?.totalEvents ?? '–'}</Text><Mini>Ocorrências</Mini></View>
      </View>
      <SectionTitle right={<TouchableOpacity onPress={() => setTab('events')} accessibilityRole="button"><Text style={s.link}>Ver tudo →</Text></TouchableOpacity>}>Prioridades recentes</SectionTitle>
      {events.length ? events.slice(0, 3).map(e => <EventCard key={e.id} event={e} />)
        : <Blank icon="📡" title="Nenhum dado carregado" explanation="Confira o status da API na aba Conexão." />}
      <SectionTitle>Demonstração em tempo real</SectionTitle>
      <View style={s.infoCard}><Text style={s.body}>Gere um evento de teste no backend. Ele será enviado pelo WebSocket e aparecerá automaticamente nas telas.</Text>
        <Button disabled={busy || isOffline} onPress={simulate}>{busy ? 'Enviando...' : '⚡ Simular novo alerta'}</Button>
        <Mini style={{ marginTop: 10 }}>Dados e regiões fictícios. Não é um sistema oficial de emergências.</Mini>
      </View>
    </ScrollView>;
  }

  function Events() {
    const choices = [['TODOS','Todos'],['CRITICOS','Críticos'],['FLOOD','Alagamentos'],['HEAT','Calor'],['SERVICE','Serviços']];
    return <ScrollView contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Lista de ocorrências</Text>
      <Mini style={{ marginBottom: 12 }}>Monitoramento em lista por localização e prioridade</Mini>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 18 }}>
        {choices.map(([key,label]) => <Chip key={key} active={filter === key} onPress={() => setFilter(key)}>{label}</Chip>)}
      </ScrollView>
      <Mini style={{ marginBottom: 12 }}>{visible.length} resultado(s), ordenados por pontuação de risco</Mini>
      {visible.length ? visible.map(e => <EventCard key={e.id} event={e} />)
        : <Blank icon="🗂️" title="Nenhuma ocorrência" explanation="Ajuste o filtro ou verifique a conexão." />}
    </ScrollView>;
  }

  function Alerts() {
    return <ScrollView contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Central de alertas</Text>
      <Mini style={{ marginBottom: 16 }}>Ocorrências com classificação ALTO ou CRÍTICO</Mini>
      <View style={s.infoCard}><Text style={s.eventTitle}>📣 Alertas em tempo real</Text>
        <Text style={[s.body, { marginVertical: 9 }]}>Novos riscos aparecem aqui e também são destacados na tela. No celular, você pode autorizar notificações locais.</Text>
        <Button secondary onPress={enableDeviceNotifications}>{deviceNotifs ? '✓ Notificações ativadas' : 'Ativar notificações do aparelho'}</Button>
      </View>
      <SectionTitle>{alerts.length} alerta(s) prioritário(s)</SectionTitle>
      {alerts.length ? alerts.map(e => <EventCard key={e.id} event={e} />)
        : <Blank icon="✅" title="Sem alertas prioritários" explanation="Os eventos de menor risco continuam disponíveis na lista geral." />}
    </ScrollView>;
  }

  function Report() {
    return <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.pageTitle}>Relatar ocorrência</Text>
      <Mini style={{ marginBottom: 18 }}>Contribua anonimamente para o monitoramento. Não forneça nomes, telefones ou endereços residenciais.</Mini>
      <View style={s.infoCard}>
        <Text style={s.fieldLabel}>Tipo de risco</Text>
        <View style={[s.wrap, { marginBottom: 13 }]}>{[['FLOOD','🌧️ Alagamento'],['HEAT','🌡️ Calor'],['SERVICE','⚡ Serviço']].map(([key,label]) =>
          <Chip key={key} active={reportType === key} onPress={() => setReportType(key)}>{label}</Chip>)}</View>
        <Field label="Título" placeholder="Ex.: Rua com água acumulada" value={reportTitle} onChangeText={setReportTitle} />
        <Field label="Descrição" placeholder="Descreva o que está acontecendo" value={reportDesc} onChangeText={setReportDesc} multiline />
        <Field label="Bairro / região" placeholder="Ex.: Centro" value={reportPlace} onChangeText={setReportPlace} />
        <Text style={s.fieldLabel}>Gravidade percebida: {reportSeverity}/5</Text>
        <View style={s.wrap}>{[1,2,3,4,5].map(n => <Chip key={n} active={reportSeverity === n} onPress={() => setReportSeverity(n)}>{n}</Chip>)}</View>
        <Mini style={{ marginTop: 14, marginBottom: 15 }}>Relatos da comunidade iniciam com confiança de 65%, sujeitos a confirmação.</Mini>
        <Button disabled={busy || isOffline} onPress={submitReport}>{busy ? 'Enviando...' : 'Enviar relato'}</Button>
      </View>
    </ScrollView>;
  }

  function Settings() {
    return <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.pageTitle}>Conexão e diagnóstico</Text>
      <View style={s.infoCard}>
        <Text style={s.eventTitle}>Servidor API</Text>
        <Mini style={{ marginBottom: 14 }}>{httpBase(host)}</Mini>
        <View style={[s.inlineStatus, { borderColor: connection === 'online' ? '#74CEAB' : '#E2AC82' }]}>
          <Text style={{ color: C.text, fontWeight: '700' }}>{connection === 'online' ? '🟢 API + WebSocket online' :
            connection === 'partial' ? '🟠 API acessível, WebSocket aguardando' : connection === 'connecting' ? '🟡 Conectando...' : '🔴 Servidor indisponível'}</Text>
        </View>
        <Text style={[s.body, { marginTop: 14 }]}>No celular físico, informe o IPv4 do computador (mesmo Wi-Fi). Para Android emulador, use 10.0.2.2. No navegador do próprio PC, use localhost.</Text>
        <Field label="IP do computador (sem http:// e sem porta)" placeholder="192.168.1.10" value={hostInput} onChangeText={setHostInput} />
        <Button onPress={changeHost}>Aplicar IP e reconectar</Button>
        <Button secondary onPress={() => setRetry(n => n + 1)} style={{ marginTop: 9 }}>Tentar novamente</Button>
      </View>
      <SectionTitle>Como testar a recuperação</SectionTitle>
      <View style={s.infoCard}>
        <Text style={s.body}>1. Verifique o status “AO VIVO”.</Text>
        <Text style={s.body}>2. Pare o Spring Boot com Ctrl+C no terminal.</Text>
        <Text style={s.body}>3. O app mostra “SEM CONEXÃO” e mantém os últimos eventos sem travar.</Text>
        <Text style={s.body}>4. Reinicie o Spring Boot. A reconexão é automática em poucos segundos.</Text>
      </View>
      <Mini style={{ textAlign: 'center', marginTop: 14 }}>UrbanGuard • FIAP Global Solution 2026.2 • Ambiente acadêmico</Mini>
    </ScrollView>;
  }

  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="light-content" backgroundColor={C.navy} />
    <View style={s.header}>
      <View style={s.brand}><View style={s.logo}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>UG</Text></View>
        <View><Text style={s.brandName}>UrbanGuard</Text><Text style={s.brandCaption}>RISCO URBANO • INTELIGÊNCIA</Text></View></View>
      <StatusPill state={connection} />
    </View>
    {connection === 'offline' && <TouchableOpacity onPress={() => setTab('settings')}
      accessibilityRole="button" style={s.offlineBanner}><Text style={s.offlineText}>Sem conexão com o servidor. Dados anteriores preservados. Toque para configurar.</Text></TouchableOpacity>}
    {newAlert && <TouchableOpacity onPress={() => { setNewAlert(null); setUnread(0); setTab('alerts'); }}
      accessibilityRole="button" style={s.alertBanner}><Text style={s.alertBannerText}>🚨 NOVO ALERTA: {newAlert.title} · Ver alertas</Text></TouchableOpacity>}
    {!!notice && <TouchableOpacity onPress={() => setNotice('')} style={s.notice} accessibilityRole="button"><Text style={s.noticeText}>{notice} · ×</Text></TouchableOpacity>}
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        {tab === 'home' ? Home() : tab === 'events' ? Events() : tab === 'alerts' ? Alerts() : tab === 'report' ? Report() : Settings()}
      </View>
    </KeyboardAvoidingView>
    <View style={s.nav}>{tabs.map(([key, icon, label]) =>
      <TouchableOpacity key={key} onPress={() => { setTab(key); if (key === 'alerts') { setUnread(0); setNewAlert(null); } }}
        accessibilityLabel={label} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}
        style={[s.navItem, tab === key && s.navActive]}>
        <View><Text style={[s.navIcon, tab === key && { color: C.blue }]}>{icon}</Text>
          {key === 'alerts' && unread > 0 && <View style={s.unreadDot} />}</View>
        <Text style={[s.navLabel, tab === key && { color: C.blue, fontWeight: '800' }]}>{label}</Text>
      </TouchableOpacity>)}
    </View>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.navy, paddingHorizontal: 16, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: C.white, fontWeight: '900', fontSize: 19, letterSpacing: -.3 },
  brandCaption: { color: '#94A9CB', fontSize: 8, fontWeight: '800', letterSpacing: 1.05 },
  statusPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 20 },
  content: { padding: 17, paddingBottom: 32 },
  hero: { backgroundColor: C.navy2, padding: 20, borderRadius: 20, minHeight: 213, justifyContent: 'space-between' },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 9, letterSpacing: -.4 },
  heroDesc: { color: '#C9D7EB', lineHeight: 20, marginTop: 8, fontSize: 13 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 17 },
  heroNumber: { fontSize: 40, fontWeight: '900', color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 9, marginTop: 12 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 15, paddingVertical: 17, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statValue: { color: C.navy2, fontSize: 27, fontWeight: '900' },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 23, marginBottom: 13 },
  sectionText: { color: C.text, fontWeight: '900', fontSize: 17 },
  link: { color: C.blue, fontSize: 12, fontWeight: '800' },
  eventCard: { backgroundColor: '#fff', borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  eventTitle: { fontSize: 14, color: C.text, fontWeight: '900', marginTop: 2 },
  eventDesc: { fontSize: 13, color: '#53647A', lineHeight: 19, marginTop: 9 },
  scoreBadge: { minWidth: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  scoreBadgeText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  eventSeparator: { height: 1, backgroundColor: C.border, marginTop: 12, marginBottom: 9 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, flexWrap: 'wrap' },
  infoCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 17 },
  body: { fontSize: 13, color: '#53647A', lineHeight: 21 },
  button: { paddingHorizontal: 13, minHeight: 45, borderRadius: 11, backgroundColor: C.blue,
    alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  secondaryButton: { backgroundColor: '#EDF4FF', borderWidth: 1, borderColor: '#C8DCF9' },
  buttonLabel: { color: '#fff', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  empty: { backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', padding: 29, borderWidth: 1, borderColor: C.border },
  pageTitle: { color: C.text, fontSize: 24, fontWeight: '900', marginBottom: 4 },
  chip: { backgroundColor: '#fff', borderColor: C.border, borderWidth: 1, borderRadius: 25, paddingHorizontal: 13, paddingVertical: 9 },
  chipText: { color: '#52647E', fontWeight: '700', fontSize: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fieldLabel: { color: C.text, fontWeight: '800', fontSize: 13, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: '#CAD4E0', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 11, backgroundColor: '#F9FBFD', fontSize: 14, color: C.text },
  inlineStatus: { borderWidth: 1, borderRadius: 11, padding: 13, backgroundColor: '#F8FBFC' },
  offlineBanner: { backgroundColor: '#FCE5E8', paddingHorizontal: 16, paddingVertical: 10 },
  offlineText: { color: '#A52A3B', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  alertBanner: { backgroundColor: '#FCE8C8', paddingVertical: 11, paddingHorizontal: 15 },
  alertBannerText: { color: '#8E420C', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  notice: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#E5F3EA' },
  noticeText: { fontSize: 12, color: '#257B50', textAlign: 'center' },
  nav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 11 : 6, paddingTop: 7, justifyContent: 'space-between' },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 5, borderRadius: 9 },
  navActive: { backgroundColor: '#EDF4FF' },
  navIcon: { fontSize: 21, color: '#78879B', fontWeight: '800' },
  navLabel: { fontSize: 10, color: '#78879B', marginTop: 2 },
  unreadDot: { position: 'absolute', top: 0, right: -6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4314C' },
});
