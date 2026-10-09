import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineChartBar, HiOutlineUsers, HiOutlineCollection, HiOutlineQuestionMarkCircle } from 'react-icons/hi';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AdminPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [components, setComponents] = useState([]);
  const [componentQuestions, setComponentQuestions] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedComp, setSelectedComp] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newCat, setNewCat] = useState('');
  const [newQ, setNewQ] = useState({ text: '', weight: 0, is_disqualifier: false, display_order: 0, good_answer: 'yes' });

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
      } else if (tab === 'components' && selectedCat) {
        const res = await api.get(`/categories/${selectedCat}/components`);
        setComponents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((tab === 'questions' || tab === 'components') && selectedCat) loadData();
  }, [selectedCat]);

  useEffect(() => {
    if (tab === 'components' && selectedComp) {
      api.get(`/components/${selectedComp}/questions`).then(res => setComponentQuestions(res.data));
    }
  }, [selectedComp]);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      await api.post('/admin/categories', { name: newCat });
      setNewCat('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed');
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed');
    }
  };

  const addQuestion = async () => {
    if (!newQ.text.trim() || !selectedCat) return;
    try {
      await api.post('/admin/questions', { ...newQ, category_id: selectedCat });
      setNewQ({ text: '', weight: 0, is_disqualifier: false, display_order: 0, good_answer: 'yes' });
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed');
    }
  };

  const deleteQuestion = async (id) => {
    try {
      await api.delete(`/admin/questions/${id}`);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed');
    }
  };

  const verifyUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/verify`);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed');
    }
  };

  const tabs = [
    { key: 'analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { key: 'categories', label: 'Categories', icon: HiOutlineCollection },
    { key: 'questions', label: 'Questions', icon: HiOutlineQuestionMarkCircle },
    { key: 'components', label: 'Components', icon: HiOutlineCollection },
    { key: 'users', label: 'Users', icon: HiOutlineUsers },
  ];

  // Category selector used by questions and components tabs
  const CategorySelector = () => (
    <div className="glass-card p-5 mb-5">
      <label className="form-label">Select Category</label>
      <select
        value={selectedCat || ''}
        onChange={(e) => setSelectedCat(e.target.value)}
        className="form-input"
      >
        <option value="">— Choose a category —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="page-container relative">
      <div className="glow-orb w-[400px] h-[400px] bg-primary-600/8 -top-[50px] right-0" />

      <div className="page-header relative z-10 animate-fade-up">
        <h1 className="page-title gradient-text">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2 relative z-10 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap border ${
              tab === t.key
                ? 'bg-primary-500/15 text-primary-400 border-primary-500/25'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-light border-transparent'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ═══ ANALYTICS ═══ */}
            {tab === 'analytics' && analytics && (
              <div className="space-y-6 animate-fade-up">
                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="glass-card stat-card">
                    <div className="stat-icon bg-gradient-to-br from-primary-500 to-primary-600">
                      <HiOutlineChartBar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-text-primary">{analytics.totalDevices}</p>
                      <p className="text-xs text-text-muted font-medium">Total Devices</p>
                    </div>
                  </div>
                  <div className="glass-card stat-card">
                    <div className="stat-icon bg-gradient-to-br from-emerald-500 to-emerald-600">
                      <HiOutlineCheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-emerald-400">{analytics.divertedFromLandfill}</p>
                      <p className="text-xs text-text-muted font-medium">Diverted from Landfill</p>
                    </div>
                  </div>
                  <div className="glass-card stat-card">
                    <div className="stat-icon bg-gradient-to-br from-cyan-500 to-cyan-600">
                      <HiOutlineChartBar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-primary-400">
                        {analytics.totalDevices > 0
                          ? Math.round((analytics.divertedFromLandfill / analytics.totalDevices) * 100)
                          : 0}%
                      </p>
                      <p className="text-xs text-text-muted font-medium">Diversion Rate</p>
                    </div>
                  </div>
                </div>

                {/* By Category */}
                <div className="glass-card p-6">
                  <h3 className="font-bold text-text-primary mb-5">Devices by Category</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.byCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* By Outcome */}
                <div className="glass-card p-6">
                  <h3 className="font-bold text-text-primary mb-5">Classification Outcomes</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="h-[200px] w-full sm:w-[200px] flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.byOutcome}
                            dataKey="count"
                            nameKey="result"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                          >
                            {analytics.byOutcome.map((entry, index) => {
                              const colors = {
                                reuse: '#10b981',
                                resell: '#06b6d4',
                                refurbish: '#f59e0b',
                                recycle: '#f43f5e',
                              };
                              return <Cell key={`cell-${index}`} fill={colors[entry.result] || '#64748b'} stroke="transparent" />;
                            })}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {analytics.byOutcome.map((o) => {
                        const colors = {
                          reuse: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20',
                          resell: 'text-cyan-700 bg-cyan-500/10 border-cyan-500/20',
                          refurbish: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
                          recycle: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
                        };
                        return (
                          <div key={o.result} className={`p-4 rounded-xl text-center border ${colors[o.result] || ''}`}>
                            <p className="text-xl font-bold">{o.count}</p>
                            <p className="text-xs font-semibold capitalize mt-1 opacity-80">{o.result}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Component Stats */}
                {analytics.componentStats.length > 0 && (
                  <div className="glass-card p-6 overflow-hidden">
                    <h3 className="font-bold text-text-primary mb-5">Component Reuse/Recycle Stats</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-3 px-4 text-text-muted font-medium">Component</th>
                            <th className="text-left py-3 px-4 text-text-muted font-medium">Status</th>
                            <th className="text-right py-3 px-4 text-text-muted font-medium">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.componentStats.map((s, i) => (
                            <tr key={i} className="border-b border-border/30">
                              <td className="py-3 px-4 text-text-primary font-medium">{s.component}</td>
                              <td className={`py-3 px-4 capitalize ${s.result === 'reusable' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {s.result}
                              </td>
                              <td className="py-3 px-4 text-right text-text-primary font-medium">{s.count}</td>
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
                    <h3 className="font-bold text-text-primary mb-5">Requests by Status</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {analytics.requestsByStatus.map((r) => (
                        <div key={r.status} className="p-5 rounded-2xl bg-surface-light/60 text-center border border-border/50">
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
              <div className="space-y-4 animate-fade-up">
                <div className="glass-card p-5 flex gap-3">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="form-input flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button onClick={addCategory} className="btn-primary">
                    <HiOutlinePlus className="w-4 h-4" /> Add
                  </button>
                </div>

                {categories.map((cat) => (
                  <div key={cat.id} className="glass-card p-5 flex items-center justify-between">
                    <span className="text-text-primary font-medium">{cat.name}</span>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-text-muted hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-500/10">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ QUESTIONS ═══ */}
            {tab === 'questions' && (
              <div className="space-y-4 animate-fade-up">
                <CategorySelector />

                {selectedCat && (
                  <>
                    {/* Add question form */}
                    <div className="glass-card p-5 space-y-4">
                      <input
                        type="text"
                        placeholder="Question text"
                        value={newQ.text}
                        onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
                        className="form-input"
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="form-label">Weight</label>
                          <input
                            type="number"
                            value={newQ.weight}
                            onChange={(e) => setNewQ({ ...newQ, weight: parseInt(e.target.value) || 0 })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">Order</label>
                          <input
                            type="number"
                            value={newQ.display_order}
                            onChange={(e) => setNewQ({ ...newQ, display_order: parseInt(e.target.value) || 0 })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">Good Answer</label>
                          <select
                            value={newQ.good_answer}
                            onChange={(e) => setNewQ({ ...newQ, good_answer: e.target.value })}
                            className="form-input"
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer py-2">
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
                      <button onClick={addQuestion} className="btn-primary">
                        <HiOutlinePlus className="w-4 h-4" /> Add Question
                      </button>
                    </div>

                    {/* Question list */}
                    {questions.map((q) => (
                      <div key={q.id} className="glass-card p-5 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary text-sm font-medium">{q.text}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="badge !text-[11px] text-text-muted bg-surface-lighter border-border">W: {q.weight}</span>
                            <span className="badge !text-[11px] text-text-muted bg-surface-lighter border-border">#{q.display_order}</span>
                            <span className="badge !text-[11px] text-text-muted bg-surface-lighter border-border">Good: {q.good_answer}</span>
                            {q.is_disqualifier && (
                              <span className="badge !text-[11px] text-amber-400 bg-amber-500/10 border-amber-500/20">⚠ Disqualifier</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => deleteQuestion(q.id)} className="p-2 text-text-muted hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-500/10 flex-shrink-0">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ═══ COMPONENTS ═══ */}
            {tab === 'components' && (
              <div className="space-y-4 animate-fade-up">
                <CategorySelector />

                {selectedCat && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {components.map((comp) => (
                        <div
                          key={comp.id}
                          onClick={() => setSelectedComp(comp.id === selectedComp ? null : comp.id)}
                          className={`glass-card p-5 cursor-pointer transition-all duration-200 ${
                            selectedComp === comp.id ? '!border-primary-500/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-text-primary font-medium text-sm">{comp.name}</span>
                            <span className="text-xs text-text-muted">Click to view questions</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedComp && componentQuestions.length > 0 && (
                      <div className="glass-card p-5 space-y-3">
                        <h3 className="font-bold text-text-primary text-sm mb-3">
                          Questions for {components.find(c => c.id === selectedComp)?.name}
                        </h3>
                        {componentQuestions.map((q) => (
                          <div key={q.id} className="py-2.5 px-3 rounded-xl bg-surface-light/50 flex items-center justify-between">
                            <span className="text-text-secondary text-sm">{q.text}</span>
                            <div className="flex gap-1.5">
                              <span className="badge !text-[11px] text-text-muted bg-surface-lighter border-border">W: {q.weight}</span>
                              <span className="badge !text-[11px] text-text-muted bg-surface-lighter border-border">Good: {q.good_answer}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ═══ USERS ═══ */}
            {tab === 'users' && (
              <div className="space-y-3 animate-fade-up">
                {users.map((u, i) => (
                  <div key={u.id} className="glass-card p-5 flex items-center justify-between animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-text-primary font-medium text-sm">{u.name}</p>
                        <div className="flex gap-x-3 text-xs text-text-muted mt-0.5">
                          <span>{u.email}</span>
                          <span className="capitalize">{u.role}</span>
                          {u.location && <span>📍 {u.location}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {u.verified ? (
                        <span className="badge text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                          <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => verifyUser(u.id)}
                          className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-all duration-200"
                        >
                          Verify
                        </button>
                      )}
                      <button 
                        onClick={() => deleteUser(u.id)}
                        className="p-2 text-text-muted hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-500/10"
                        title="Delete User"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
