function sortEvents(events) {
  return [...events].sort((a, b) =>
    (b.priorityScore - a.priorityScore) ||
    (Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0)));
}
function filterEvents(events, kind) {
  if (kind === 'CRITICOS') return events.filter(e => e.priorityScore >= 80);
  if (kind === 'FLOOD' || kind === 'HEAT' || kind === 'SERVICE')
    return events.filter(e => e.eventType === kind);
  return events;
}
function riskColor(score) {
  if (score >= 80) return '#D4314C';
  if (score >= 60) return '#E88628';
  if (score >= 40) return '#BF8B18';
  return '#278C71';
}
function labelType(type) {
  return ({ FLOOD: 'Alagamento', HEAT: 'Ilha de calor', SERVICE: 'Serviço essencial' })[type] || 'Ocorrência';
}
function labelSource(source) {
  return ({ SENSOR: 'Sensor', PUBLIC: 'Base pública', COMMUNITY: 'Comunidade' })[source] || 'Origem não identificada';
}
module.exports = { sortEvents, filterEvents, riskColor, labelType, labelSource };
