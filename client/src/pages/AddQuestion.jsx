import { useState } from "react";

function AddQuestion() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [week, setWeek] = useState(1);
  const [status, setStatus] = useState("");

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/questions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          options,
          correctAnswer,
          explanation,
          week,
        }),
      }
    );

    const data = await res.json();
    setStatus(data.message || "Question added");

    // reset form
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setExplanation("");
  };

  return (
    <div style={{ maxWidth: "700px", margin: "auto", padding: "40px" }}>
      <h2>Add Weekly Aptitude Question (Admin)</h2>

      <form onSubmit={handleSubmit}>
        <p>
          <b>Question</b>
        </p>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          rows={3}
          style={{ width: "100%" }}
        />

        <p>
          <b>Options</b>
        </p>
        {options.map((opt, i) => (
          <div key={i}>
            <input
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt}
              required
              onChange={(e) => handleOptionChange(i, e.target.value)}
              style={{ width: "100%", marginBottom: "5px" }}
            />
          </div>
        ))}

        <p>
          <b>Correct Answer (0–3)</b>
        </p>
        <input
          type="number"
          min="0"
          max="3"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(Number(e.target.value))}
        />

        <p>
          <b>Explanation</b>
        </p>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          required
          rows={3}
          style={{ width: "100%" }}
        />

        <p>
          <b>Week Number</b>
        </p>
        <input
          type="number"
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
        />

        <br />
        <br />
        <button type="submit">Add Question</button>
      </form>

      <p style={{ marginTop: "15px", color: "green" }}>{status}</p>
    </div>
  );
}

export default AddQuestion;
