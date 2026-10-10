import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineArrowLeft, HiOutlineCog } from 'react-icons/hi';

export default function ComponentAssessmentPage() {
 const { deviceId } = useParams();
 const navigate = useNavigate();
 const [device, setDevice] = useState(null);
 const [components, setComponents] = useState([]);
 const [currentComp, setCurrentComp] = useState(0);
 const [currentQ, setCurrentQ] = useState(0);
 const [allQuestions, setAllQuestions] = useState({});
 const [allAnswers, setAllAnswers] = useState({});
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
 loadData();
 }, [deviceId]);

 const loadData = async () => {
 try {
 const deviceRes = await api.get(`/devices/${deviceId}`);
 setDevice(deviceRes.data);

 const compRes = await api.get(`/categories/${deviceRes.data.category_id}/components`);
 setComponents(compRes.data);

 const questionsMap = {};
 for (const comp of compRes.data) {
 const qRes = await api.get(`/components/${comp.id}/questions`);
 questionsMap[comp.id] = qRes.data;
 }
 setAllQuestions(questionsMap);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 const currentComponent = components[currentComp];
 const questions = currentComponent ? allQuestions[currentComponent.id] || [] : [];
 const question = questions[currentQ];

 const handleAnswer = (answer) => {
 const compId = currentComponent.id;
 const qId = question.id;
 const updated = {
 ...allAnswers,
 [compId]: { ...(allAnswers[compId] || {}), [qId]: answer },
 };
 setAllAnswers(updated);

 if (currentQ < questions.length - 1) {
 setCurrentQ(currentQ + 1);
 } else {
 moveToNextComponent(updated);
 }
 };

 const moveToNextComponent = (updatedAnswers) => {
 if (currentComp < components.length - 1) {
 setCurrentComp(currentComp + 1);
 setCurrentQ(0);
 } else {
 submitAll(updatedAnswers);
 }
 };

 const submitAll = async (finalAnswers) => {
 setSubmitting(true);
 try {
 const componentResponses = components.map((comp) => ({
 component_id: comp.id,
 responses: Object.entries(finalAnswers[comp.id] || {}).map(([qid, ans]) => ({
 question_id: parseInt(qid),
 answer: ans,
 })),
 }));

 await api.post(`/components/${deviceId}/assess`, { componentResponses });
 navigate(`/devices/${deviceId}/components/results`);
 } catch (err) {
 console.error(err);
 } finally {
 setSubmitting(false);
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="w-10 h-10 border-4 border-brand-ghost border-t-brand rounded-full animate-spin" />
 </div>
 );
 }

 if (submitting) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
 <div className="w-12 h-12 border-4 border-brand-ghost border-t-brand rounded-full animate-spin" />
 <p className="text-ink text-base font-medium">Evaluating salvage components…</p>
 <p className="text-muted text-xs">Computing reusable parts viability & recycling recovery actions</p>
 </div>
 );
 }

 if (components.length === 0) {
 return (
 <div className="page-container max-w-2xl text-center py-16">
 <p className="text-muted text-sm">No component assessments defined for this category.</p>
 </div>
 );
 }

 const totalQuestions = components.reduce((acc, c) => acc + (allQuestions[c.id]?.length || 0), 0);
 const answeredQuestions = Object.values(allAnswers).reduce(
 (acc, compAnswers) => acc + Object.keys(compAnswers).length,
 0,
 );
 const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

 return (
 <div className="page-container max-w-2xl">
 {/* Header */}
 <div className="page-header animate-fade-up">
 <div className="text-xs font-semibold uppercase tracking-wider text-brand bg-brand-tint border border-brand-ghost px-3 py-1 rounded-full inline-block mb-2">
 Modular Salvage Assessment
 </div>
 <h1 className="page-title text-ink">Component Integrity Diagnostics</h1>
 <p className="page-subtitle">{device?.brand} {device?.model}</p>
 </div>

 {/* Component navigation stepper */}
 <div className="flex gap-2 mb-5 overflow-x-auto pb-1 animate-fade-up">
 {components.map((comp, i) => {
 const isActive = i === currentComp;
 const isDone = i < currentComp;
 return (
 <div
 key={comp.id}
 className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
 isActive
 ? 'bg-brand text-surface border-brand-ghost font-semibold'
 : isDone
 ? 'bg-brand-tint text-brand border-brand-ghost'
 : 'bg-white text-muted border-line'
 }`}
 >
 {isDone && <span className="mr-1 text-brand font-bold">✓</span>}
 {comp.name}
 </div>
 );
 })}
 </div>

 {/* Progress bar */}
 <div className="mb-6 animate-fade-up">
 <div className="flex justify-between text-xs text-muted mb-2 font-medium">
 <span>{currentComponent?.name} • Question {currentQ + 1} of {questions.length}</span>
 <span>{Math.round(progress)}% Completed</span>
 </div>
 <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
 <div
 className="h-full bg-brand rounded-full transition-all duration-300"
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>

 {/* Question Card */}
 {question && (
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-6 sm:p-8 bg-white border border-line shadow-xs animate-fade-up">
 <div className="text-xs font-semibold text-brand mb-2 flex items-center gap-1.5">
 <HiOutlineCog className="w-4 h-4" /> {currentComponent?.name} Diagnostic
 </div>

 {question.is_disqualifier && (
 <div className="mb-4 px-3 py-1 rounded-full bg-warning-bg border border-warning-bg text-warning-text text-[11px] font-semibold inline-flex items-center gap-1">
 Critical Check
 </div>
 )}

 <h2 className="text-lg sm:text-xl font-medium text-ink mb-8 leading-relaxed">
 {question.text}
 </h2>

 <div className="grid grid-cols-2 gap-3 sm:gap-4">
 <button
 onClick={() => handleAnswer('yes')}
 className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border border-brand-ghost bg-brand-tint hover:bg-brand-tint text-brand font-semibold text-base transition-colors cursor-pointer"
 >
 <HiOutlineCheckCircle className="w-6 h-6 text-brand" />
 Yes
 </button>
 <button
 onClick={() => handleAnswer('no')}
 className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border border-danger-bg bg-danger-bg hover:bg-danger-bg text-danger-text font-semibold text-base transition-colors cursor-pointer"
 >
 <HiOutlineXCircle className="w-6 h-6 text-danger-text" />
 No
 </button>
 </div>

 {currentQ > 0 && (
 <button
 onClick={() => setCurrentQ(currentQ - 1)}
 className="mt-6 text-xs text-muted hover:text-ink transition-colors flex items-center gap-1 cursor-pointer"
 >
 <HiOutlineArrowLeft className="w-3.5 h-3.5" />
 Previous question
 </button>
 )}
 </div>
 )}
 </div>
 );
}
