import { useState, useEffect } from 'react';
import api from '../api';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineChartBar, HiOutlineUsers, HiOutlineCollection, HiOutlineQuestionMarkCircle } from 'react-icons/hi';

export default function AdminPage() {
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [loading, setLoading] = useState(true);

  // New category / question forms
  const [newCat, setNewCat] = useState('');
  const [newQ, setNewQ] = useState({ text: '', weight: 0, is_disqualifier: false, display_order: 0 });

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'analytics') {
        const res = await api.get('/admin/analytics');
        setAnalytics(res.data);
      } else if (tab === 'categories') {
        const res = await api.get('/categories');
        setCategories(res.data);
      } else if (tab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } else if (tab === 'questions' && selectedCat) {
        const res = await api.get(`/categories/${selectedCat}/questions`);
        setQuestions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'questions' && selectedCat) loadData();
  }, [selectedCat]);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      await api.post('/admin/categories', { name: newCat });
      setNewCat('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const addQuestion = async () => {
    if (!newQ.text.trim() || !selectedCat) return;
    try {
      await api.post('/admin/questions', { ...newQ, category_id: selectedCat });
      setNewQ({ text: '', weight: 0, is_disqualifier: false, display_order: 0 });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const deleteQuestion = async (id) => {
    try {
      await api.delete(`/admin/questions/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const verifyUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/verify`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const tabs = [
    { key: 'analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { key: 'categories', label: 'Categories', icon: HiOutlineCollection },
    { key: 'questions', label: 'Questions', icon: HiOutlineQuestionMarkCircle },
    { key: 'users', label: 'Users', icon: HiOutlineUsers },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold gradient-text mb-8">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-light border border-transparent'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ═══ ANALYTICS ═══ */}
          {tab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass-card p-5 text-center">
                  <p className="text-3xl font-bold text-text-primary">{analytics.totalDevices}</p>
                  <p className="text-sm text-text-muted mt-1">Total Devices</p>
                </div>
                <div className="glass-card p-5 text-center">
                  <p className="text-3xl font-bold text-emerald-400">{analytics.divertedFromLandfill}</p>
                  <p className="text-sm text-text-muted mt-1">Diverted from Landfill</p>
                </div>
                <div className="glass-card p-5 text-center">
                  <p className="text-3xl font-bold text-primary-400">
                    {analytics.totalDevices > 0
                      ? Math.round((analytics.divertedFromLandfill / analytics.totalDevices) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-text-muted mt-1">Diversion Rate</p>
                </div>
              </div>

              {/* By Category */}
              <div className="glass-card p-6">
                <h3 className="font-semibold text-text-primary mb-4">Devices by Category</h3>
                <div className="space-y-3">
                  {analytics.byCategory.map((c) => (
                    <div key={c.category} className="flex items-center justify-between">
                      <span className="text-text-secondary">{c.category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-surface-lighter rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full"
                            style={{ width: `${analytics.totalDevices ? (c.count / analytics.totalDevices) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-text-primary font-medium w-8 text-right">{c.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Outcome */}
              <div className="glass-card p-6">
                <h3 className="font-semibold text-text-primary mb-4">Classification Outcomes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {analytics.byOutcome.map((o) => {
                    const colors = {
                      reuse: 'text-emerald-400 bg-emerald-500/10',
                      resell: 'text-cyan-400 bg-cyan-500/10',
                      refurbish: 'text-amber-400 bg-amber-500/10',
                      recycle: 'text-rose-400 bg-rose-500/10',
                    };
                    return (
                      <div key={o.result} className={`p-4 rounded-xl text-center ${colors[o.result] || ''}`}>
                        <p className="text-2xl font-bold">{o.count}</p>
                        <p className="text-sm capitalize mt-1">{o.result}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Component Stats */}
              {analytics.componentStats.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Component Reuse/Recycle Stats</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-text-secondary">Component</th>
                          <th className="text-left py-2 px-3 text-text-secondary">Status</th>
                          <th className="text-right py-2 px-3 text-text-secondary">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.componentStats.map((s, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 px-3 text-text-primary">{s.component}</td>
                            <td className={`py-2 px-3 capitalize ${s.result === 'reusable' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {s.result}
                            </td>
                            <td className="py-2 px-3 text-right text-text-primary">{s.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Requests by Status */}
              {analytics.requestsByStatus.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Requests by Status</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {analytics.requestsByStatus.map((r) => (
                      <div key={r.status} className="p-4 rounded-xl bg-surface-light text-center">
                        <p className="text-2xl font-bold text-text-primary">{r.count}</p>
                        <p className="text-sm text-text-muted capitalize mt-1">{r.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ CATEGORIES ═══ */}
          {tab === 'categories' && (
            <div className="space-y-4">
              <div className="glass-card p-4 flex gap-3">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="flex-1 px-4 py-2 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 outline-none"
                />
                <button
                  onClick={addCategory}
                  className="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-xl font-medium hover:bg-primary-500/30 transition-all flex items-center gap-2"
                >
                  <HiOutlinePlus className="w-4 h-4" /> Add
                </button>
              </div>

              {categories.map((cat) => (
                <div key={cat.id} className="glass-card p-4 flex items-center justify-between">
                  <span className="text-text-primary font-medium">{cat.name}</span>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-2 text-text-muted hover:text-rose-400 transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ═══ QUESTIONS ═══ */}
          {tab === 'questions' && (
            <div className="space-y-4">
              {/* Category selector */}
              <div className="glass-card p-4">
                <label className="text-sm text-text-secondary mb-2 block">Select Category</label>
                <select
                  value={selectedCat || ''}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text-primary focus:border-primary-500 outline-none"
                >
                  <option value="">-- Choose --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedCat && (
                <>
                  {/* Add question form */}
                  <div className="glass-card p-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Question text"
                      value={newQ.text}
                      onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 outline-none"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-text-muted">Weight</label>
                        <input
                          type="number"
                          value={newQ.weight}
                          onChange={(e) => setNewQ({ ...newQ, weight: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary focus:border-primary-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">Order</label>
                        <input
                          type="number"
                          value={newQ.display_order}
                          onChange={(e) => setNewQ({ ...newQ, display_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary focus:border-primary-500 outline-none text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newQ.is_disqualifier}
                            onChange={(e) => setNewQ({ ...newQ, is_disqualifier: e.target.checked })}
                            className="rounded"
                          />
                          Disqualifier
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={addQuestion}
                      className="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-xl font-medium hover:bg-primary-500/30 transition-all flex items-center gap-2"
                    >
                      <HiOutlinePlus className="w-4 h-4" /> Add Question
                    </button>
                  </div>

                  {/* Question list */}
                  {questions.map((q) => (
                    <div key={q.id} className="glass-card p-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-text-primary text-sm">{q.text}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-text-muted">Weight: {q.weight}</span>
                          <span className="text-xs text-text-muted">Order: {q.display_order}</span>
                          {q.is_disqualifier && (
                            <span className="text-xs text-amber-400">⚠ Disqualifier</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="p-2 text-text-muted hover:text-rose-400 transition-colors"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ═══ USERS ═══ */}
          {tab === 'users' && (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-text-primary font-medium">{u.name}</p>
                    <div className="flex gap-3 text-sm text-text-muted mt-1">
                      <span>{u.email}</span>
                      <span className="capitalize">{u.role}</span>
                      {u.location && <span>📍 {u.location}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {u.verified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                        <HiOutlineCheckCircle className="w-4 h-4" /> Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => verifyUser(u.id)}
                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-all"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
