class CurationsDB {
  constructor() {
    this.KEY = 'webgem_curations_v1';
    this.defaultData = { underappreciated: [], overlooked: [], rising: [] };
  }

  async load() {
    try {
      const res = await window.websim?.fetchApi?.({ url: '/api/v1/curations', options: { method: 'GET' } });
      if (res?.status === 200 && res.body) {
        const text = await new Response(res.body).text();
        return JSON.parse(text || '{}') || this._loadLocal();
      }
    } catch (_) { /* fall back */ }
    return this._loadLocal();
  }

  async save(data) {
    this._saveLocal(data);
    try {
      await window.websim?.fetchApi?.({
        url: '/api/v1/curations',
        options: { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }
      });
    } catch (_) { /* ignore */ }
  }

  async add(listKey, item) {
    const data = await this.load();
    const list = data[listKey] || (data[listKey] = []);
    if (!list.find(x => x.id === item.id)) list.push(item);
    await this.save(data);
    return data;
  }

  async remove(listKey, id) {
    const data = await this.load();
    data[listKey] = (data[listKey] || []).filter(x => x.id !== id);
    await this.save(data);
    return data;
  }

  _loadLocal() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || { ...this.defaultData }; } catch { return { ...this.defaultData }; }
  }

  _saveLocal(data) { try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch {} }
}

window.curationsDB = new CurationsDB();