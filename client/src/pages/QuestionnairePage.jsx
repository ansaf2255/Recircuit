import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineArrowLeft } from 'react-icons/hi';

export default function QuestionnairePage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    const q = questions[currentQ];
    const newAnswers = { ...answers, [q.id]: answer };
    setAnswers(newAnswers);

    if (q.is_disqualifier && answer !== q.good_answer) {
      submitAnswers(newAnswers);
      return;
    }

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      submitAnswers(newAnswers);
    }
  };

  const submitAnswers = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const responses = Object.entries(finalAnswers).map(([qid, ans]) => ({
        question_id: parseInt(qid),
        answer: ans,
      }));

      questions.forEach((q) => {
        if (!finalAnswers[q.id]) {
          responses.push({ question_id: q.id, answer: 'no' });
        }
      });

      await api.post(`/questionnaire/${deviceId}`, { responses });
      navigate(`/devices/${deviceId}/result`);
    } catch (err) {
      console.error(err);
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
        <p className="text-text-secondary text-lg font-medium">Analyzing device condition…</p>
      </div>
    );
  }

  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  const question = questions[currentQ];

  return (
    <div className="page-container max-w-2xl relative">
      <div className="glow-orb w-[350px] h-[350px] bg-primary-600/10 -top-[50px] -right-[100px]" />

      {/* Header */}
      <div className="page-header relative z-10 animate-fade-up">
        <h1 className="page-title text-text-primary">Device Assessment</h1>
        <p className="page-subtitle">
          {device?.brand} {device?.model} — {device?.category_name}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 relative z-10 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex justify-between text-sm text-text-muted mb-2.5">
          <span className="font-medium">Question {currentQ + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2.5 bg-surface-lighter rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {question && (
        <div className="glass-card p-8 sm:p-10 relative z-10 animate-fade-up" style={{ animationDelay: '160ms' }}>
          {question.is_disqualifier && (
            <div className="mb-5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold inline-flex items-center gap-1.5">
              ⚠️ Critical Question
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-10 leading-snug">
            {question.text}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer('yes')}
              className="flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-emerald-500/25 bg-emerald-500/[0.04] hover:bg-emerald-500/15 hover:border-emerald-500/50 text-emerald-400 font-semibold text-lg transition-all duration-200 group"
            >
              <HiOutlineCheckCircle className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
              Yes
            </button>
            <button
              onClick={() => handleAnswer('no')}
              className="flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-rose-500/25 bg-rose-500/[0.04] hover:bg-rose-500/15 hover:border-rose-500/50 text-rose-400 font-semibold text-lg transition-all duration-200 group"
            >
              <HiOutlineXCircle className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
              No
            </button>
          </div>

          {/* Back nav */}
          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ(currentQ - 1)}
              className="mt-8 text-sm text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1.5"
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
