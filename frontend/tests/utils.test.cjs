const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sortEvents, filterEvents, riskColor, labelSource } = require('../src/utils.cjs');
test('alertas mais urgentes aparecem primeiro', () => {
  const events = [{ id: 1, priorityScore: 30 }, { id: 2, priorityScore: 92 }, { id: 3, priorityScore: 65 }];
  assert.deepEqual(sortEvents(events).map(e => e.id), [2, 3, 1]);
  assert.equal(events[0].id, 1); // não altera a entrada
});
test('filtros exibem somente itens pedidos', () => {
  const events = [{eventType:'FLOOD',priorityScore:90}, {eventType:'HEAT',priorityScore:55}];
  assert.equal(filterEvents(events, 'CRITICOS').length, 1);
  assert.equal(filterEvents(events, 'HEAT').length, 1);
});
test('indicadores e origem dos dados', () => {
  assert.equal(riskColor(85), '#D4314C');
  assert.equal(labelSource('COMMUNITY'), 'Comunidade');
});
