import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

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

      // Load questions for each component
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

    // If disqualifier answered 'yes', skip to next component
    if (question.is_disqualifier && answer === 'yes') {
      // Fill remaining questions with 'no'
      questions.forEach((q) => {
        if (!updated[compId]?.[q.id]) {
          updated[compId] = { ...(updated[compId] || {}), [q.id]: 'no' };
        }
      });
      setAllAnswers(updated);
      moveToNextComponent(updated);
      return;
    }

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
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-text-secondary text-lg">Analyzing components…</p>
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-text-secondary">No components defined for this category.</p>
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Component Assessment</h1>
        <p className="text-text-secondary mt-1">
          {device?.brand} {device?.model}
        </p>
      </div>

      {/* Component tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {components.map((comp, i) => {
          const isActive = i === currentComp;
          const isDone = i < currentComp;
          return (
            <div
              key={comp.id}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : isDone
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-surface-light text-text-muted border border-border'
              }`}
            >
              {isDone && '✓ '}{comp.name}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-text-muted mb-2">
          <span>{currentComponent?.name} — Q{currentQ + 1}/{questions.length}</span>
          <span>{Math.round(progress)}% overall</span>
        </div>
        <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {question && (
        <div className="glass-card p-8">
          <div className="text-sm text-primary-400 font-medium mb-2">
            🔧 {currentComponent?.name}
          </div>

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
        </div>
      )}
    </div>
  );
}
