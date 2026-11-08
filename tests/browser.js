// Run in Chrome DevTools on the app (use a separate browser profile).
// Preserves the previous localStorage value after testing.
async function runShiftTests() {
  const storageKey = 'mis-cambios-v1';
  const backup = localStorage.getItem(storageKey);
  const results = [];
  let frame;
  const assert = (condition, message) => { if (!condition) throw Error(message); results.push(message); };
  const legacy = [
    {id:'a',name:'Ána',date:'2026-01-01',shift:'SOL',direction:'mine',status:'realizado',createdAt:'original',custom:'preserved'},
    {id:'b',name:'Ána',date:'2026-01-02',shift:'LUNA',direction:'theirs',status:'anulado'},
    {id:'c',name:'Ána',date:'2026-01-03',shift:'JN',direction:'theirs',status:'programado'}
  ];
  async function load() {
    if (frame) frame.remove();
    frame = document.createElement('iframe');
    frame.src = './index.html';
    const ready = new Promise(resolve => frame.onload = resolve);
    document.body.append(frame); await ready;
    return frame.contentWindow;
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(legacy));
    let w = await load(), d = w.document;
    const click = selector => d.querySelector(selector).click();
    const submit = values => {
      for (const [key,value] of Object.entries(values)) d.getElementById(key).value=value;
      d.getElementById('form').requestSubmit();
    };
    const saved = () => JSON.parse(localStorage.getItem(storageKey));
    assert(saved().length === 3 && d.querySelector('.positive').textContent === '1', 'Legacy storage and balance preserved');
    click('[data-action="person"]'); click('[data-action="edit"][data-id="a"]');
    submit({reason:'Partido <script>alert(1)</script>'});
    assert(saved()[2].createdAt === 'original' && saved()[2].custom === 'preserved', 'Editing preserves metadata');
    assert(d.querySelector('.reason').textContent.includes('<script>') && !d.querySelector('.reason script'), 'Reason rendered safely');
    click('[data-action="edit"][data-id="b"]'); submit({reason:'Viaje'});
    assert(saved().find(r=>r.id==='b').status === 'anulado', 'Editing annulled record keeps status');
    click('[data-action="newrejected"]');
    d.getElementById('reason').value = 'Cita médica';
    d.getElementById('notes').value = 'No podía';
    d.getElementById('date').value = '2099-01-01';
    d.getElementById('date').dispatchEvent(new w.Event('change',{bubbles:true}));
    assert(d.getElementById('reason').value === 'Cita médica' && d.getElementById('status').value === 'rechazado', 'Date change preserves text and rejection');
    submit({});
    const rejection = saved().find(r=>r.status==='rechazado');
    assert(rejection && rejection.direction==='theirs' && rejection.notes==='No podía', 'Rejection saved with observations');
    assert(d.querySelector('.tile strong').textContent === '+1' && d.body.textContent.includes('1 aceptadas · 1 rechazadas'), 'Rejection excluded from balance and counted per person');
    click('[data-action="edit"][data-id="'+rejection.id+'"]'); submit({reason:'Motivo editado'});
    assert(saved().find(r=>r.id===rejection.id).reason==='Motivo editado', 'Rejection reason editable');
    w = await load(); d = w.document;
    assert(d.body.textContent.includes('1 aceptadas · 1 rechazadas'), 'Rejection survives reload');
    click('[data-action="settings"]');
    let exported;
    w.URL.createObjectURL = blob => { exported = blob; return 'blob:test'; };
    w.HTMLAnchorElement.prototype.click = function() {};
    click('[data-action="export"]');
    const copy = JSON.parse(await exported.text());
    assert(copy.version===1 && copy.records.some(r=>r.reason==='Motivo editado'), 'JSON export includes new fields');
    w.confirm = () => true;
    const alerts=[]; w.alert = message => alerts.push(message);
    async function restore(payload) {
      const input = d.getElementById('file');
      const transfer = new w.DataTransfer();
      transfer.items.add(new w.File([JSON.stringify(payload)], 'copy.json', {type:'application/json'}));
      input.files = transfer.files; input.dispatchEvent(new w.Event('change',{bubbles:true}));
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    await restore({app:'mis-cambios-de-turno',version:1,records:legacy});
    assert(saved().length===3 && !saved().some(r=>r.status==='rechazado'), 'Legacy JSON import accepted');
    click('[data-action="settings"]'); await restore(copy);
    assert(saved().some(r=>r.reason==='Motivo editado'), 'New JSON round trip preserves rejection and reason');
    click('[data-action="settings"]');
    await restore({...copy,records:[{...copy.records[0],reason:42}]});
    assert(alerts.length===1 && saved().length===copy.records.length, 'Invalid JSON rejected without replacing data');
    return results;
  } finally {
    if (backup===null) localStorage.removeItem(storageKey); else localStorage.setItem(storageKey,backup);
    if(frame) frame.remove();
  }
}
