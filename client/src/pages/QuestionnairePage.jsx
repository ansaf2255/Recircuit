import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineArrowLeft, HiOutlineLightningBolt } from 'react-icons/hi';

const sectionMeta = {
  power: { label: 'Power & System Boot', icon: '⚡', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  screen: { label: 'Display & Touchscreen', icon: '📱', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  body: { label: 'Body & Physical Casing', icon: '🛡️', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  hardware: { label: 'Hardware, Audio & Battery', icon: '⚙️', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  hazard: { label: 'Safety & Damage Hazards', icon: '⚠️', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  general: { label: 'General Condition', icon: '📋', badge: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export default function QuestionnairePage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const loadData = async () => {
    try {
      const deviceRes = await api.get(`/devices/${deviceId}`);
      setDevice(deviceRes.data);
      const qRes = await api.get(`/categories/${deviceRes.data.category_id}/questions`);
      setQuestions(qRes.data);
    } catch (err) {
      console.error('Failed to load questionnaire data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find the primary power/boot question
  const powerQuestion = useMemo(() => {
    return questions.find(q => q.section === 'power' && q.display_order === 1) || questions[0];
  }, [questions]);

  // Determine if device powers on based on current answers
  const isPoweredOn = useMemo(() => {
    if (!powerQuestion) return true;
    return answers[powerQuestion.id] !== 'no';
  }, [answers, powerQuestion]);

  // Filter questions dynamically: if device doesn't power on, skip power-dependent tests
  const activeQuestions = useMemo(() => {
    return questions.filter(q => {
      if (!isPoweredOn && q.requires_power) return false;
      return true;
    });
  }, [questions, isPoweredOn]);

  // Ensure currentQIndex stays in bounds
  const safeIndex = Math.min(currentQIndex, Math.max(0, activeQuestions.length - 1));
  const currentQuestion = activeQuestions[safeIndex];

  const handleAnswer = (answer) => {
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    if (safeIndex < activeQuestions.length - 1) {
      setCurrentQIndex(safeIndex + 1);
    } else {
      submitAnswers(newAnswers);
    }
  };

  const submitAnswers = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const responses = [];

      // Send answers for all questions
      questions.forEach((q) => {
        if (finalAnswers[q.id]) {
          responses.push({ question_id: q.id, answer: finalAnswers[q.id] });
        } else if (!isPoweredOn && q.requires_power) {
          // If power-dependent test was skipped because device doesn't power on, record as 'no'
          responses.push({ question_id: q.id, answer: 'no' });
        } else {
          responses.push({ question_id: q.id, answer: 'no' });
        }
      });

      await api.post(`/questionnaire/${deviceId}`, { responses });
      navigate(`/devices/${deviceId}/result`);
    } catch (err) {
      console.error('Failed to submit questionnaire:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-text-primary text-lg font-medium">Computing Diagnostic Scoring…</p>
        <p className="text-text-secondary text-sm">Evaluating hardware integrity and circular classification rules</p>
      </div>
    );
  }

  const progress = activeQuestions.length > 0 ? ((safeIndex + 1) / activeQuestions.length) * 100 : 0;
  const section = currentQuestion ? sectionMeta[currentQuestion.section] || sectionMeta.general : sectionMeta.general;

  return (
    <div className="page-container max-w-2xl relative">
      {/* Header */}
      <div className="page-header relative z-10 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-full">
            Inspection Diagnostics
          </span>
        </div>
        <h1 className="page-title text-text-primary">Device Condition Assessment</h1>
        <p className="page-subtitle">
          {device?.brand} {device?.model} — {device?.category_name}
        </p>
      </div>

      {/* Progress & Section Bar */}
      <div className="mb-6 relative z-10 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center justify-between text-sm text-text-muted mb-2.5">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${section.badge} flex items-center gap-1.5`}>
              <span>{section.icon}</span>
              {section.label}
            </span>
          </div>
          <span className="font-medium text-text-secondary">
            Step {safeIndex + 1} of {activeQuestions.length} ({Math.round(progress)}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden border border-border/40">
          <div
            className="h-full bg-primary-700 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Power Skip Notice Banner */}
        {!isPoweredOn && currentQuestion && (
          <div className="mt-3 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
            <HiOutlineLightningBolt className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Device does not power on — skipped screen & software diagnostics to evaluate physical casing & safety.
            </span>
          </div>
        )}
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="glass-card p-6 sm:p-10 relative z-10 animate-fade-up" style={{ animationDelay: '140ms' }}>
          {currentQuestion.is_disqualifier && (
            <div className="mb-4 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium inline-flex items-center gap-1.5">
              ⚠️ Critical Check
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-medium text-text-primary mb-8 leading-snug">
            {currentQuestion.text}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleAnswer('yes')}
              className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 group cursor-pointer ${
                answers[currentQuestion.id] === 'yes'
                  ? 'border-emerald-600 bg-emerald-100/70 text-emerald-800 font-bold shadow-xs'
                  : 'border-emerald-600/20 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-600/40 text-emerald-800 font-semibold'
              }`}
            >
              <HiOutlineCheckCircle className="w-7 h-7 text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-lg">Yes</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnswer('no')}
              className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 group cursor-pointer ${
                answers[currentQuestion.id] === 'no'
                  ? 'border-rose-600 bg-rose-100/70 text-rose-800 font-bold shadow-xs'
                  : 'border-rose-600/20 bg-rose-50 hover:bg-rose-100 hover:border-rose-600/40 text-rose-800 font-semibold'
              }`}
            >
              <HiOutlineXCircle className="w-7 h-7 text-rose-600 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-lg">No</span>
            </button>
          </div>

          {/* Previous question button */}
          {safeIndex > 0 && (
            <button
              type="button"
              onClick={() => setCurrentQIndex(safeIndex - 1)}
              className="mt-8 text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
              Previous question
            </button>
          )}
        </div>
      )}
    </div>
  );
}
