import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

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

    // Check if disqualifier answered 'yes' → skip to submit
    if (q.is_disqualifier && answer === 'yes') {
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

      // Fill in 'no' for any unanswered questions (skipped due to disqualifier)
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
        <p className="text-text-secondary text-lg">Analyzing device condition…</p>
      </div>
    );
  }

  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  const question = questions[currentQ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Device Assessment</h1>
        <p className="text-text-secondary mt-1">
          {device?.brand} {device?.model} — {device?.category_name}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-text-muted mb-2">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {question && (
        <div className="glass-card p-8">
          {question.is_disqualifier && (
            <div className="mb-4 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium inline-block">
              ⚠️ Critical Question
            </div>
          )}

          <h2 className="text-xl font-semibold text-text-primary mb-8">
            {question.text}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer('yes')}
              className="flex items-center justify-center gap-3 p-5 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/60 text-emerald-400 font-semibold text-lg transition-all group"
            >
              <HiOutlineCheckCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
              Yes
            </button>
            <button
              onClick={() => handleAnswer('no')}
              className="flex items-center justify-center gap-3 p-5 rounded-xl border-2 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/60 text-rose-400 font-semibold text-lg transition-all group"
            >
              <HiOutlineXCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
              No
            </button>
          </div>

          {/* Navigation */}
          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ(currentQ - 1)}
              className="mt-6 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              ← Previous question
            </button>
          )}
        </div>
      )}
    </div>
  );
}
