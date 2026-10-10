import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { 
 HiOutlinePlus, 
 HiOutlineTrash, 
 HiOutlineCheckCircle, 
 HiOutlineChartBar, 
 HiOutlineUsers, 
 HiOutlineCollection, 
 HiOutlineQuestionMarkCircle,
 HiOutlineShieldCheck,
 HiOutlineCog,
 HiOutlineClipboardList,
 HiOutlineLocationMarker,
 HiOutlineDocumentDownload,
 HiOutlineClock,
 HiOutlineEye,
 HiOutlineX
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const GOOGLE_CHART_COLORS = {
 reuse: '#137333', // Google Green
 resell: '#1a73e8', // Google Blue
 refurbish: '#b06000', // Google Amber
 recycle: '#c5221f', // Google Red
};

export default function AdminPage() {
 const { addToast } = useToast();
 const [tab, setTab] = useState('analytics');
 const [analytics, setAnalytics] = useState(null);
 const [platformOrders, setPlatformOrders] = useState([]);
 const [categories, setCategories] = useState([]);
 const [users, setUsers] = useState([]);
 const [questions, setQuestions] = useState([]);
 const [components, setComponents] = useState([]);
 const [componentQuestions, setComponentQuestions] = useState([]);
 const [selectedCat, setSelectedCat] = useState(null);
 const [selectedComp, setSelectedComp] = useState(null);
 const [loading, setLoading] = useState(true);

 const [newCat, setNewCat] = useState('');
 const [newCompName, setNewCompName] = useState('');
 const [newQ, setNewQ] = useState({ 
 text: '', 
 weight: 10, 
 is_disqualifier: false, 
 display_order: 1, 
 good_answer: 'yes',
 section: 'general',
 requires_power: false 
 });
 const [newCompQ, setNewCompQ] = useState({ 
 text: '', 
 weight: 10, 
 is_disqualifier: false, 
 display_order: 1, 
 good_answer: 'yes' 
 });

 useEffect(() => {
 loadData();
 }, [tab]);

 const loadData = async () => {
 setLoading(true);
 try {
 if (tab === 'analytics') {
 const res = await api.get('/admin/analytics');
 setAnalytics(res.data);
 } else if (tab === 'orders') {
 const res = await api.get('/requests');
 setPlatformOrders(res.data);
 } else if (tab === 'categories') {
 const res = await api.get('/categories');
 setCategories(res.data);
 } else if (tab === 'users') {
 const res = await api.get('/admin/users');
 setUsers(res.data);
 } else if (tab === 'questions' || tab === 'components') {
 // Ensure categories are loaded
 let catId = selectedCat;
 if (categories.length === 0) {
 const catRes = await api.get('/categories');
 setCategories(catRes.data);
 if (!catId && catRes.data.length > 0) {
 catId = catRes.data[0].id;
 setSelectedCat(catId);
 }
 }
 if (catId) {
 if (tab === 'questions') {
 const res = await api.get(`/categories/${catId}/questions`);
 setQuestions(res.data);
 } else if (tab === 'components') {
 const res = await api.get(`/categories/${catId}/components`);
 setComponents(res.data);
 }
 }
 }
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 if ((tab === 'questions' || tab === 'components') && selectedCat) {
 if (tab === 'questions') {
 api.get(`/categories/${selectedCat}/questions`).then(res => setQuestions(res.data)).catch(console.error);
 } else if (tab === 'components') {
 api.get(`/categories/${selectedCat}/components`).then(res => setComponents(res.data)).catch(console.error);
 setSelectedComp(null);
 setComponentQuestions([]);
 }
 }
 }, [selectedCat]);

 const loadComponentQuestions = async (compId) => {
 if (!compId) {
 setComponentQuestions([]);
 return;
 }
 try {
 const res = await api.get(`/components/${compId}/questions`);
 setComponentQuestions(res.data);
 setNewCompQ(prev => ({ ...prev, display_order: (res.data.length || 0) + 1 }));
 } catch (err) {
 console.error('Failed to load component questions:', err);
 }
 };

 useEffect(() => {
 if (tab === 'components' && selectedComp) {
 loadComponentQuestions(selectedComp);
 } else {
 setComponentQuestions([]);
 }
 }, [selectedComp]);

 const addCategory = async () => {
 if (!newCat.trim()) return;
 try {
 await api.post('/admin/categories', { name: newCat });
 setNewCat('');
 loadData();
 addToast('Category added successfully.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to add category');
 }
 };

 const deleteCategory = async (id) => {
 if (!confirm('Are you sure you want to delete this category?')) return;
 try {
 await api.delete(`/admin/categories/${id}`);
 loadData();
 addToast('Category deleted.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to delete category');
 }
 };

 const addComponent = async () => {
 if (!newCompName.trim() || !selectedCat) return;
 try {
 await api.post('/admin/components', { category_id: selectedCat, name: newCompName.trim() });
 setNewCompName('');
 const res = await api.get(`/categories/${selectedCat}/components`);
 setComponents(res.data);
 addToast('Component added.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to add component');
 }
 };

 const deleteComponent = async (id, e) => {
 if (e) e.stopPropagation();
 if (!confirm('Are you sure you want to delete this component and its questions?')) return;
 try {
 await api.delete(`/admin/components/${id}`);
 if (selectedComp === id) {
 setSelectedComp(null);
 setComponentQuestions([]);
 }
 const res = await api.get(`/categories/${selectedCat}/components`);
 setComponents(res.data);
 addToast('Component removed.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to delete component');
 }
 };

 const addComponentQuestion = async () => {
 if (!newCompQ.text.trim() || !selectedComp) return;
 try {
 await api.post('/admin/component-questions', {
 ...newCompQ,
 component_id: selectedComp,
 });
 setNewCompQ({
 text: '',
 weight: 10,
 is_disqualifier: false,
 display_order: (componentQuestions.length || 0) + 2,
 good_answer: 'yes',
 });
 loadComponentQuestions(selectedComp);
 addToast('Component diagnostic question added.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to add question');
 }
 };

 const deleteComponentQuestion = async (id) => {
 try {
 await api.delete(`/admin/component-questions/${id}`);
 loadComponentQuestions(selectedComp);
 addToast('Diagnostic question removed.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to delete question');
 }
 };

 const addQuestion = async () => {
 if (!newQ.text.trim() || !selectedCat) return;
 try {
 await api.post('/admin/questions', { ...newQ, category_id: selectedCat });
 setNewQ({ 
 text: '', 
 weight: 10, 
 is_disqualifier: false, 
 display_order: questions.length + 1, 
 good_answer: 'yes',
 section: 'general',
 requires_power: false 
 });
 loadData();
 addToast('Diagnostic question added.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to add question');
 }
 };

 const deleteQuestion = async (id) => {
 try {
 await api.delete(`/admin/questions/${id}`);
 loadData();
 addToast('Question removed.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to delete question');
 }
 };

 const verifyUser = async (id) => {
 try {
 await api.patch(`/admin/users/${id}/verify`);
 loadData();
 addToast('User credentials verified.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to verify');
 }
 };

 const deleteUser = async (id) => {
 if (!confirm('Are you sure you want to remove this user account?')) return;
 try {
 await api.delete(`/admin/users/${id}`);
 loadData();
 addToast('User account deleted.');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to delete user');
 }
 };

 const tabs = [
 { key: 'analytics', label: 'Analytics & Impact', icon: HiOutlineChartBar },
 { key: 'orders', label: 'Platform Orders Audit', icon: HiOutlineClipboardList },
 { key: 'categories', label: 'Hardware Categories', icon: HiOutlineCollection },
 { key: 'questions', label: 'Diagnostic Engine', icon: HiOutlineQuestionMarkCircle },
 { key: 'components', label: 'Salvage Components', icon: HiOutlineCog },
 { key: 'users', label: 'Directory & Partners', icon: HiOutlineUsers },
 ];

 const CategorySelector = () => (
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-4 sm:p-5 mb-5 bg-white">
 <label className="form-label">Active Hardware Category</label>
 <select
 value={selectedCat || ''}
 onChange={(e) => setSelectedCat(e.target.value)}
 className="form-input !text-xs !py-2"
 >
 <option value="">— Select Category to Configure —</option>
 {categories.map((c) => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </div>
 );

 return (
 <div className="page-container">
 {/* Header */}
 <div className="page-header animate-fade-up">
 <h1 className="page-title text-ink">Enterprise Administration</h1>
 <p className="page-subtitle">Configure diagnostic engines, manage categories, and audit circular operations</p>
 </div>

 {/* Navigation Tabs (Google MD3 Pill Stepper) */}
 <div className="flex gap-2 mb-6 overflow-x-auto pb-1 animate-fade-up">
 {tabs.map((t) => (
 <button
 key={t.key}
 onClick={() => setTab(t.key)}
 className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer border ${
 tab === t.key
 ? 'bg-brand text-surface border-brand-ghost font-semibold'
 : 'bg-white text-muted hover:text-ink border-line hover:bg-page'
 }`}
 >
 <t.icon className="w-4 h-4" />
 {t.label}
 </button>
 ))}
 </div>

 <div>
 {loading ? (
 <div className="flex items-center justify-center py-20">
 <div className="w-10 h-10 border-4 border-brand-ghost border-t-brand rounded-full animate-spin" />
 </div>
 ) : (
 <>
 {/* ═══ ANALYTICS TAB ═══ */}
 {tab === 'analytics' && analytics && (
 <div className="space-y-6 animate-fade-up">
 {/* Metric Summary Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] stat-card bg-white">
 <div className="stat-icon bg-brand-tint text-brand">
 <HiOutlineChartBar className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-bold text-ink">{analytics.totalDevices}</p>
 <p className="text-xs text-muted font-medium">Total Registered Devices</p>
 </div>
 </div>
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] stat-card bg-white">
 <div className="stat-icon bg-brand-tint text-brand">
 <HiOutlineCheckCircle className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-bold text-brand">{analytics.divertedFromLandfill}</p>
 <p className="text-xs text-muted font-medium">Diverted from Landfill</p>
 </div>
 </div>
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] stat-card bg-white">
 <div className="stat-icon bg-blue-50 text-blue-700">
 <HiOutlineChartBar className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-bold text-brand">
 {analytics.totalDevices > 0
 ? Math.round((analytics.divertedFromLandfill / analytics.totalDevices) * 100)
 : 0}%
 </p>
 <p className="text-xs text-muted font-medium">Circular Diversion Rate</p>
 </div>
 </div>
 </div>

 {/* By Category */}
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-6 bg-white">
 <h3 className="text-sm font-bold text-ink mb-4">Hardware Inventory by Category</h3>
 <div className="h-[240px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={analytics.byCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e0e2e0" vertical={false} />
 <XAxis dataKey="category" tick={{ fill: '#444746', fontSize: 12 }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fill: '#444746', fontSize: 12 }} axisLine={false} tickLine={false} />
 <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0e2e0', fontSize: '12px' }} />
 <Bar dataKey="count" fill="#0b57d0" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* By Outcome */}
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-6 bg-white">
 <h3 className="text-sm font-bold text-ink mb-4">Diagnostic Classification Outcomes</h3>
 <div className="flex flex-col sm:flex-row items-center gap-8">
 <div className="h-[180px] w-[180px] flex-shrink-0">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={analytics.byOutcome}
 dataKey="count"
 nameKey="result"
 cx="50%"
 cy="50%"
 innerRadius={50}
 outerRadius={75}
 paddingAngle={4}
 >
 {analytics.byOutcome.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={GOOGLE_CHART_COLORS[entry.result] || '#747775'} stroke="transparent" />
 ))}
 </Pie>
 <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0e2e0', fontSize: '12px' }} />
 </PieChart>
 </ResponsiveContainer>
 </div>

 <div className="grid grid-cols-2 gap-3 w-full">
 {analytics.byOutcome.map((o) => (
 <div key={o.result} className="p-4 rounded-xl bg-surface border border-line text-center">
 <p className="text-xl font-bold text-ink">{o.count}</p>
 <p className="text-xs font-semibold uppercase tracking-wider text-muted mt-0.5">{o.result}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ═══ PLATFORM ORDERS AUDIT TAB ═══ */}
 {tab === 'orders' && (
 <div className="space-y-4 animate-fade-up">
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 bg-white border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h3 className="text-base font-bold text-ink">System-Wide Circular Transactions</h3>
 <p className="text-xs text-muted mt-0.5">
 Full administrative oversight of device pickups, logistics partners, and certificate issuance
 </p>
 </div>
 <div className="flex items-center gap-2">
 <span className="badge bg-brand-tint text-brand border-brand-ghost text-xs">
 {platformOrders.length} Total Requests
 </span>
 </div>
 </div>

 {platformOrders.length === 0 ? (
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-12 text-center bg-white">
 <HiOutlineClipboardList className="w-10 h-10 text-muted mx-auto mb-2" />
 <p className="text-sm font-semibold text-ink">No platform orders or pickup requests found</p>
 <p className="text-xs text-muted mt-1">When users initiate pickups with partners, transactions appear here.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {platformOrders.map((ord) => {
 const statusStyles = {
 pending: 'bg-warning-bg text-warning-text border-warning-bg',
 accepted: 'bg-blue-50 text-blue-800 border-blue-200',
 completed: 'bg-brand-tint text-brand border-brand-ghost',
 cancelled: 'bg-danger-bg text-danger-text border-danger-bg',
 };
 return (
 <div key={ord.id} className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 bg-white border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-[11px] uppercase font-semibold text-muted tracking-wider">
 {ord.category_name}
 </span>
 <span className={`badge capitalize text-[11px] ${statusStyles[ord.status] || 'bg-surface text-muted border-line'}`}>
 {ord.status}
 </span>
 {ord.classification && (
 <span className="badge uppercase text-[10px] bg-surface text-ink border-line">
 Outcome: {ord.classification}
 </span>
 )}
 </div>

 <h4 className="font-bold text-ink text-base">
 {ord.brand} {ord.model}
 </h4>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-muted">
 <div>
 <span className="text-muted">Seller: </span>
 <strong className="text-ink font-medium">{ord.seller_name}</strong>
 {ord.seller_email && <span className="text-muted"> ({ord.seller_email})</span>}
 </div>
 <div>
 <span className="text-muted">Partner: </span>
 <strong className="text-ink font-medium">{ord.partner_name}</strong>
 {ord.partner_email && <span className="text-muted"> ({ord.partner_email})</span>}
 </div>
 </div>

 {ord.device_location && (
 <div className="mt-1.5 text-xs text-muted flex items-center gap-1">
 <HiOutlineLocationMarker className="w-3.5 h-3.5 flex-shrink-0" />
 <span>{ord.device_location}</span>
 </div>
 )}
 </div>

 <div className="flex items-center gap-2 flex-shrink-0">
 {ord.status === 'completed' && (
 <Link
 to={`/certificate/${ord.id}`}
 className="btn-ghost !text-xs !py-1.5 !px-3 flex items-center gap-1 text-brand"
 >
 <HiOutlineDocumentDownload className="w-4 h-4" />
 Certificate
 </Link>
 )}
 <span className="text-[11px] text-muted">
 Req #{ord.id}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* ═══ CATEGORIES TAB ═══ */}
 {tab === 'categories' && (
 <div className="space-y-4 animate-fade-up">
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 bg-white flex gap-3">
 <input
 type="text"
 placeholder="New hardware category name (e.g. Wearables, Servers)"
 value={newCat}
 onChange={(e) => setNewCat(e.target.value)}
 className="form-input flex-1 !text-xs !py-2"
 onKeyDown={(e) => e.key === 'Enter' && addCategory()}
 />
 <button onClick={addCategory} className="btn-primary !text-xs !py-2 cursor-pointer">
 <HiOutlinePlus className="w-4 h-4" /> Add Category
 </button>
 </div>

 <div className="space-y-2">
 {categories.map((cat) => (
 <div key={cat.id} className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-4 bg-white flex items-center justify-between">
 <span className="text-ink font-medium text-sm">{cat.name}</span>
 <button 
 onClick={() => deleteCategory(cat.id)} 
 className="p-1.5 text-muted hover:text-danger-text rounded-lg hover:bg-danger-bg transition-colors cursor-pointer"
 title="Delete category"
 >
 <HiOutlineTrash className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ═══ DIAGNOSTIC QUESTIONS TAB ═══ */}
 {tab === 'questions' && (
 <div className="space-y-4 animate-fade-up">
 <CategorySelector />

 {selectedCat && (
 <>
 {/* Add Question Form */}
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 bg-white space-y-4 border border-line">
 <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
 Add New Diagnostic Step
 </h3>
 <input
 type="text"
 placeholder="Diagnostic question text..."
 value={newQ.text}
 onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
 className="form-input !text-xs !py-2"
 />
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
 <div>
 <label className="form-label">Diagnostic Section</label>
 <select
 value={newQ.section}
 onChange={(e) => setNewQ({ ...newQ, section: e.target.value })}
 className="form-input !text-xs !py-1.5"
 >
 <option value="power">Power</option>
 <option value="screen">Screen / Display</option>
 <option value="body">Body / Chassis</option>
 <option value="hardware">Hardware Components</option>
 <option value="hazard">Hazard / Safety</option>
 <option value="general">General</option>
 </select>
 </div>
 <div>
 <label className="form-label">Weight (Score)</label>
 <input
 type="number"
 value={newQ.weight}
 onChange={(e) => setNewQ({ ...newQ, weight: parseInt(e.target.value) || 0 })}
 className="form-input !text-xs !py-1.5"
 />
 </div>
 <div>
 <label className="form-label">Order #</label>
 <input
 type="number"
 value={newQ.display_order}
 onChange={(e) => setNewQ({ ...newQ, display_order: parseInt(e.target.value) || 0 })}
 className="form-input !text-xs !py-1.5"
 />
 </div>
 <div>
 <label className="form-label">Passing Answer</label>
 <select
 value={newQ.good_answer}
 onChange={(e) => setNewQ({ ...newQ, good_answer: e.target.value })}
 className="form-input !text-xs !py-1.5"
 >
 <option value="yes">Yes</option>
 <option value="no">No</option>
 </select>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-muted">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={newQ.is_disqualifier}
 onChange={(e) => setNewQ({ ...newQ, is_disqualifier: e.target.checked })}
 className="rounded"
 />
 Disqualifier (forces recycle if failed)
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={newQ.requires_power}
 onChange={(e) => setNewQ({ ...newQ, requires_power: e.target.checked })}
 className="rounded"
 />
 Requires Device Power (skipped if power is No)
 </label>
 </div>

 <button onClick={addQuestion} className="btn-primary !text-xs !py-2 cursor-pointer">
 <HiOutlinePlus className="w-4 h-4" /> Add Diagnostic Question
 </button>
 </div>

 {/* Question List */}
 <div className="space-y-2">
 {questions.map((q) => (
 <div key={q.id} className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-4 bg-white flex items-start justify-between gap-4">
 <div className="flex-1 min-w-0">
 <p className="text-ink text-xs sm:text-sm font-medium">{q.text}</p>
 <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
 <span className="badge bg-surface text-muted border-line">Section: {q.section}</span>
 <span className="badge bg-surface text-muted border-line">Weight: +{q.weight}</span>
 <span className="badge bg-surface text-muted border-line">Order: #{q.display_order}</span>
 {q.requires_power && (
 <span className="badge bg-blue-50 text-blue-700 border-blue-200">Requires Power</span>
 )}
 {q.is_disqualifier && (
 <span className="badge bg-warning-bg text-warning-text border-warning-bg">Disqualifier</span>
 )}
 </div>
 </div>
 <button 
 onClick={() => deleteQuestion(q.id)} 
 className="p-1.5 text-muted hover:text-danger-text rounded-lg hover:bg-danger-bg transition-colors cursor-pointer"
 >
 <HiOutlineTrash className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </>
 )}
 </div>
 )}

 {/* ═══ COMPONENTS TAB ═══ */}
 {tab === 'components' && (
 <div className="space-y-5 animate-fade-up">
 <CategorySelector />

 {selectedCat && (
 <div className="space-y-5">
 {/* Component Management Toolbar */}
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-4 sm:p-5 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
 <div>
 <h3 className="text-ink font-bold text-sm">
 Hardware Components ({components.length})
 </h3>
 <p className="text-xs text-muted mt-0.5">
 Click any component card to inspect and configure its diagnostic rules
 </p>
 </div>

 {/* Quick Add Component */}
 <div className="flex items-center gap-2">
 <input
 type="text"
 placeholder="New component name (e.g. Camera)"
 value={newCompName}
 onChange={(e) => setNewCompName(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && addComponent()}
 className="form-input !text-xs !py-1.5 w-56"
 />
 <button
 onClick={addComponent}
 className="btn-primary !text-xs !py-1.5 !px-3 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
 >
 <HiOutlinePlus className="w-3.5 h-3.5" /> Add Part
 </button>
 </div>
 </div>

 {/* Component Cards Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {components.map((comp) => {
 const isSelected = selectedComp === comp.id;
 return (
 <div
 key={comp.id}
 onClick={() => setSelectedComp(isSelected ? null : comp.id)}
 className={`bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-4 bg-white cursor-pointer transition-all border ${
 isSelected
 ? '!border-brand-ghost bg-brand-tint/25 shadow-sm ring-1 ring-brand'
 : 'hover:border-line hover:bg-page'
 }`}
 >
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-brand' : 'bg-gray-300'}`} />
 <span className={`text-xs font-semibold truncate ${isSelected ? 'text-brand' : 'text-ink'}`}>
 {comp.name}
 </span>
 </div>

 <div className="flex items-center gap-1.5 flex-shrink-0">
 <span className={`text-[11px] font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors ${
 isSelected 
 ? 'bg-brand-tint text-brand font-semibold' 
 : 'text-muted bg-surface hover:text-ink'
 }`}>
 <HiOutlineEye className="w-3.5 h-3.5" />
 {isSelected ? 'Inspecting' : 'Inspect'}
 </span>
 <button
 type="button"
 onClick={(e) => deleteComponent(comp.id, e)}
 className="p-1 text-muted hover:text-danger-text rounded hover:bg-danger-bg transition-colors cursor-pointer"
 title="Delete component"
 >
 <HiOutlineTrash className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* Inspection Drawer / Panel for the Selected Component */}
 {selectedComp && (
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 sm:p-6 bg-white border border-brand-ghost shadow-sm space-y-5 animate-fade-up">
 <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
 <div>
 <div className="flex items-center gap-2">
 <span className="badge bg-brand-tint text-brand border-brand-ghost text-xs font-semibold">
 Component Diagnostic Inspector
 </span>
 </div>
 <h2 className="text-ink font-bold text-base sm:text-lg mt-1">
 Diagnostic Criteria for {components.find(c => c.id === selectedComp)?.name || 'Selected Component'}
 </h2>
 <p className="text-muted text-xs mt-0.5">
 These expert rules are evaluated during salvage assessment to determine if this component can be reclaimed and reused.
 </p>
 </div>
 <button
 onClick={() => setSelectedComp(null)}
 className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-surface transition-colors cursor-pointer"
 title="Close Inspector"
 >
 <HiOutlineX className="w-5 h-5" />
 </button>
 </div>

 {/* Add Component Question Form */}
 <div className="bg-surface/50 rounded-xl p-4 sm:p-5 border border-line space-y-3">
 <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
 <HiOutlinePlus className="w-3.5 h-3.5 text-brand" />
 Add Diagnostic Question for {components.find(c => c.id === selectedComp)?.name}
 </h4>

 <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
 <div className="md:col-span-6">
 <label className="form-label text-[11px]">Question Prompt</label>
 <input
 type="text"
 placeholder="e.g. Does the part show any physical damage or burn marks?"
 value={newCompQ.text}
 onChange={(e) => setNewCompQ({ ...newCompQ, text: e.target.value })}
 onKeyDown={(e) => e.key === 'Enter' && addComponentQuestion()}
 className="form-input !text-xs !py-1.5"
 />
 </div>
 <div className="md:col-span-2">
 <label className="form-label text-[11px]">Score Weight</label>
 <input
 type="number"
 value={newCompQ.weight}
 onChange={(e) => setNewCompQ({ ...newCompQ, weight: parseInt(e.target.value) || 0 })}
 className="form-input !text-xs !py-1.5"
 />
 </div>
 <div className="md:col-span-2">
 <label className="form-label text-[11px]">Passing Answer</label>
 <select
 value={newCompQ.good_answer}
 onChange={(e) => setNewCompQ({ ...newCompQ, good_answer: e.target.value })}
 className="form-input !text-xs !py-1.5"
 >
 <option value="yes">Yes</option>
 <option value="no">No</option>
 </select>
 </div>
 <div className="md:col-span-2">
 <label className="form-label text-[11px]">Display Order</label>
 <input
 type="number"
 value={newCompQ.display_order}
 onChange={(e) => setNewCompQ({ ...newCompQ, display_order: parseInt(e.target.value) || 0 })}
 className="form-input !text-xs !py-1.5"
 />
 </div>
 </div>

 <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
 <label className="flex items-center gap-2 cursor-pointer text-xs text-muted">
 <input
 type="checkbox"
 checked={newCompQ.is_disqualifier}
 onChange={(e) => setNewCompQ({ ...newCompQ, is_disqualifier: e.target.checked })}
 className="rounded text-brand focus:ring-brand"
 />
 Disqualifier rule (failing this question forces component to be recycled)
 </label>

 <button
 onClick={addComponentQuestion}
 className="btn-primary !text-xs !py-1.5 !px-3 cursor-pointer flex items-center gap-1.5"
 >
 <HiOutlinePlus className="w-3.5 h-3.5" /> Save Diagnostic Question
 </button>
 </div>
 </div>

 {/* List of Component Questions */}
 <div className="space-y-2">
 <h4 className="text-xs font-semibold text-ink">
 Configured Diagnostic Questions ({componentQuestions.length})
 </h4>

 {componentQuestions.length === 0 ? (
 <div className="p-8 text-center bg-surface/30 rounded-xl border border-dashed border-line">
 <HiOutlineQuestionMarkCircle className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
 <p className="text-xs text-muted font-medium">No diagnostic questions configured for this component.</p>
 <p className="text-[11px] text-muted mt-0.5">Use the form above to add inspection criteria for intake technicians.</p>
 </div>
 ) : (
 <div className="space-y-2">
 {componentQuestions.map((q) => (
 <div key={q.id} className="p-3 sm:p-4 rounded-xl border border-line bg-white flex items-start justify-between gap-4 hover:border-gray-300 transition-colors">
 <div className="flex-1 min-w-0">
 <p className="text-ink text-xs sm:text-sm font-medium">{q.text}</p>
 <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
 <span className="badge bg-surface text-muted border-line">Weight: +{q.weight}</span>
 <span className="badge bg-surface text-muted border-line">
 Passing: <strong className="ml-1 uppercase text-ink">{q.good_answer}</strong>
 </span>
 <span className="badge bg-surface text-muted border-line">Order: #{q.display_order}</span>
 {q.is_disqualifier && (
 <span className="badge bg-warning-bg text-warning-text border-warning-bg">
 Disqualifier
 </span>
 )}
 </div>
 </div>
 <button
 onClick={() => deleteComponentQuestion(q.id)}
 className="p-1.5 text-muted hover:text-danger-text rounded-lg hover:bg-danger-bg transition-colors cursor-pointer"
 title="Delete Question"
 >
 <HiOutlineTrash className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {/* ═══ USERS & PARTNERS TAB ═══ */}
 {tab === 'users' && (
 <div className="space-y-3 animate-fade-up">
 {users.map((u) => (
 <div key={u.id} className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-4 sm:p-5 bg-white flex items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full bg-[#d3e3fd] text-[#041e49] flex items-center justify-center font-bold text-xs flex-shrink-0">
 {u.name?.charAt(0)?.toUpperCase()}
 </div>
 <div>
 <p className="text-ink font-semibold text-xs sm:text-sm">{u.name}</p>
 <div className="flex flex-wrap gap-x-3 text-xs text-muted mt-0.5">
 <span>{u.email}</span>
 <span className="font-medium text-muted">
 {u.role === 'seller' ? 'Refurbisher / Consumer' : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
 </span>
 {u.location && <span>📍 {u.location}</span>}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 flex-shrink-0">
 {u.verified ? (
 <span className="badge bg-brand-tint text-brand border-brand-ghost text-xs">
 <HiOutlineShieldCheck className="w-3.5 h-3.5 text-brand" /> Verified
 </span>
 ) : (
 <button
 onClick={() => verifyUser(u.id)}
 className="btn-ghost !text-xs !py-1 !px-2.5 cursor-pointer"
 >
 Verify Partner
 </button>
 )}
 <button 
 onClick={() => deleteUser(u.id)}
 className="p-1.5 text-muted hover:text-danger-text rounded-lg hover:bg-danger-bg transition-colors cursor-pointer"
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
