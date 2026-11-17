# UrbanGuard | Urban Risk Intelligence Platform

**FIAP • Engenharia da Computação • Global Solution 2026.2**  
**Disciplina:** Advanced Programming And Mobile Dev

Uma plataforma demonstrativa para acompanhamento de riscos urbanos. O backend Java/Spring Boot recebe alertas de sensores simulados, fontes públicas simuladas e relatos comunitários, calcula sua prioridade, persiste os registros e transmite eventos em **tempo real via WebSocket**. Um app React Native/Expo exibe painel, ocorrências e notificações, permite novos relatos e se recupera de quedas na conexão.

> **Importante:** Todos os dados iniciais e alertas simulados são **fictícios**, inclusive supostas bases públicas. O sistema é um protótipo educacional e **não deve ser usado para decidir sobre emergências reais**.

## Funcionalidades implementadas

| Requisito do professor | Implementação |
| --- | --- |
| Backend Java com Spring Boot | `backend/` com API REST em camadas |
| Sensores, bases públicas, comunidade | `SourceType` + API de eventos + simulador com três tipos de origem |
| Dados persistidos | H2 em arquivo local: `backend/data/urbanguard.mv.db` (gerado na primeira execução) |
| Priorizar alertas e mostrar confiança | Algoritmo explicável de 0 a 100, origem e confiança de cada evento |
| App React Native | `frontend/` com Expo SDK 54 |
| Painel e lista de eventos | Abas Painel e Eventos, filtros e indicadores |
| Notificações | Centro de Alertas, faixa ao vivo e notificações **locais**, mediante permissão |
| App resiliente | WebSocket com reconexão a cada 3s + reconsulta a cada 8s e aviso de desconexão |
| Testes | JUnit (backend) e `node:test` (lógica do frontend) |
| Apresentação da queda e reconexão | Roteiro em `APRESENTACAO.md` |

## Requisitos do computador (Windows)

- **JDK 21**: confira com `java -version`.
- **Apache Maven 3.9+**: confira com `mvn -version`.
- **Node.js 20.19.4+** ou 22 LTS: confira com `node -v` e `npm -v`.
- **Celular Android/iOS com Expo Go compatível com SDK 54**, ou emulador Android. Para abrir no navegador, siga a opção Web abaixo.
- Internet para instalar dependências pela primeira vez. Smartphone e PC na mesma rede Wi-Fi para uso físico.

## Execução rápida no Windows

1. Extraia o ZIP em uma pasta normal (por exemplo, `C:\UrbanGuard`).
2. Abra o VS Code nessa pasta. Abra **Terminal > Novo Terminal**.
3. Inicie o backend no terminal 1:

   ```powershell
   cd backend
   mvn spring-boot:run
   ```

   Aguarde a mensagem de inicialização do Spring Boot. A API deve responder em http://localhost:8080/api/health.
4. Em **outro terminal** do VS Code, inicie o app:

   ```powershell
   cd frontend
   npm install
   npx expo start --lan
   ```

5. Abra o **Expo Go compatível com SDK 54** no celular e leia o QR exibido no terminal. No aplicativo, abra **Conexão** e informe o IPv4 do seu computador.

   Para descobrir o IPv4, abra outro PowerShell e digite `ipconfig`; copie o **Endereço IPv4** do adaptador Wi-Fi ou Ethernet (exemplo fictício: `192.168.1.10`). A porta `8080` já é adicionada automaticamente. **Não digite o IP fictício do exemplo.**

6. Abra **Painel** e toque em **Simular novo alerta**. Observe um novo registro sem atualizar a tela.

**Dica:** os scripts `INICIAR_BACKEND.bat` e `INICIAR_MOBILE.bat` abrem as mesmas rotinas com duplo clique se Maven e Node estiverem instalados e configurados no PATH.

### Conexão por ambiente

| Ambiente de teste | IP na aba Conexão |
| --- | --- |
| Celular real via Wi-Fi | IPv4 do computador via `ipconfig`, por exemplo `192.168.1.10` |
| Emulador Android | `10.0.2.2` |
| iOS Simulator no Mac | `localhost` |
| Navegador no próprio PC | `localhost` |

Se o celular não conectar: confirme Wi-Fi comum, IP correto, backend ativo, porta 8080 liberada no firewall do Windows e ausência de isolamento de clientes da rede. Teste `http://IP-DO-PC:8080/api/health` no navegador do próprio celular.

### Alternativa de demonstração no navegador (Windows)

O código continua sendo **React Native** e pode ser aberto via React Native Web. Dentro de `frontend/`, antes da primeira execução Web, instale dependências extras na versão correspondente ao SDK:

```powershell
npx expo install react-dom react-native-web @expo/metro-runtime
npx expo start --web
```

Web é uma alternativa útil para mostrar a interface no PC, mas recomendamos **também testar no Expo Go** para demonstrar o requisito mobile.

## API REST

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | `/api/health` | Disponibilidade da API |
| GET | `/api/events` | Eventos em ordem de prioridade |
| GET | `/api/events/{id}` | Detalhe de evento |
| GET | `/api/alerts` | Eventos com pontuação >= 60 |
| GET | `/api/dashboard` | Indicadores de monitoramento |
| POST | `/api/events` | Registrar uma observação |
| POST | `/api/demo/simulate` | Criar um novo alerta fictício de teste |
| WebSocket | `/ws/events` | Eventos ao vivo: `CONNECTED`, `EVENT_CREATED` e `HEARTBEAT` |

Para gerar um evento no PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/demo/simulate -Method Post
```

Para enviar um registro com campos completos:

```powershell
$body = @{
  eventType = 'FLOOD'; title = 'Água acumulada no bairro'
  description = 'Acúmulo de água após chuva forte'
  neighborhood = 'Centro'; city = 'Santo André'
  sourceType = 'COMMUNITY'; origin = 'Relato comunitário anônimo'
  confidence = 0.65; severity = 4; impactLevel = 3
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/events -ContentType 'application/json' -Body $body
```

**Valores aceitos:** `eventType`: `FLOOD`, `HEAT`, `SERVICE`; `sourceType`: `SENSOR`, `PUBLIC`, `COMMUNITY`. `confidence`: 0 a 1, `severity` e `impactLevel`: 1 a 5. Latitude e longitude opcionais.

## Cálculo de prioridade (análise)

Usamos uma **análise heurística explicável**, não um modelo de IA treinado. Isso atende ao requisito de **IA ou análise** para a priorização:

```text
Pontuação = 10 × gravidade (1 a 5)
          +  4 × impacto    (1 a 5)
          + 20 × confiança  (0 a 1, arredondada)
          + bônus de atualidade (10 se até 2h; 6 se até 24h; 2 depois)
```

**Faixas:** 0–39 BAIXO, 40–59 MODERADO, 60–79 ALTO, 80–100 CRÍTICO.

Os eventos novos são classificados e mantidos no H2; um agendamento recalcula a pontuação a cada minuto, permitindo que a atualidade pese menos conforme o tempo passa. A origem e a confiança permanecem visíveis no app, para evitar que um relato comunitário seja confundido com um dado confirmado.

## Testes

Backend (requer JDK/Maven e download inicial de dependências):

```powershell
cd backend
mvn test
```

Frontend (testes unitários sem Expo Go):

```powershell
cd frontend
npm test
```

Os testes cobrem a pontuação, faixas, validação, API de criação e resposta de saúde, além de ordenação e filtragem na interface. A demonstração de recuperação do backend deve ser **testada manualmente** conforme `APRESENTACAO.md`.

## Estrutura

```text
UrbanGuard_GS_2026_2/
├── backend/                 # Spring Boot, JPA/H2, REST, WebSocket, testes JUnit
├── frontend/                # React Native/Expo, telas, notificações, testes Node
├── docs/                    # Arquitetura e coleção Postman
├── INICIAR_BACKEND.bat
├── INICIAR_MOBILE.bat
├── APRESENTACAO.md          # Roteiro falado e ações na tela
├── CHECKLIST_ENTREGA.md
├── ENTREGA_FIAP_PREENCHER.txt
└── README.md
```

## Equipe e publicação

**Substituir antes de entregar** os campos abaixo pelos dados reais do grupo (até 3 integrantes):

- Integrante 1: **NOME COMPLETO** | RM: **XXXXXX**
- Integrante 2: **NOME COMPLETO** | RM: **XXXXXX**
- Integrante 3 (se houver): **NOME COMPLETO** | RM: **XXXXXX**

O repositório do GitHub **ainda precisa ser criado/publicado**. Coloque o link real em `ENTREGA_FIAP_PREENCHER.txt`. Faça commits autênticos da equipe, ao longo da organização, validação e revisão do projeto; não simule histórico de outras pessoas.

## Arquitetura, proteção e limites

Camadas: **Controller → Service (análise) → Repository → H2**; eventos WebSocket broadcast para o app. REST também serve como fallback de sincronização. Veja `docs/ARQUITETURA.md`.

- O relato é anônimo: o app não pede nome, e-mail, telefone, GPS obrigatório nem login; a API registra apenas dados do evento.
- Dados de demonstração e CORS liberado são **somente para a rede de laboratório**. Os endpoints POST não têm autenticação e não devem ser expostos publicamente.
- H2 em disco oferece simplicidade e persistência local; para escalabilidade em produção, migrar a PostgreSQL, usar filas/event bus, autenticação/autorização, HTTPS/WSS, limitação de requisições, auditoria e políticas LGPD.
- O backend não consulta serviços públicos reais: as fontes públicas são explicitamente simuladas, conforme o enunciado permite para sensores e para uma demonstração acadêmica.

## Como demonstrar ao professor

Leia o roteiro pronto em **`APRESENTACAO.md`**. A demonstração requer os dois processos **rodando no computador**, não apenas abrir arquivos de código.
