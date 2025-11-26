"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";
onClick = {() => setManualMode('text')}
                    >
                        📝 Text Input
                    </button >
    <button
        className={`btn ${manualMode === 'image' ? '' : 'btn-secondary'}`}
        onClick={() => setManualMode('image')}
    >
        📷 Image Upload
    </button>
                </div >

    {/* Inputs */ }
{
    manualMode === 'text' ? (
        <div className="form-group">
            <textarea
                className="input"
                placeholder="Type or paste your question here..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                style={{ minHeight: '120px' }}
            />
        </div>
    ) : (
    <div className="form-group">
        <div style={{ border: '2px dashed var(--border)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ marginBottom: '1rem' }}
            />
            {manualImage && (
                <div style={{ marginTop: '1rem' }}>
                    <img src={manualImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 'var(--radius-sm)' }} />
                </div>
            )}
        </div>
    </div>
)
}

<button
    className="btn"
    onClick={enrichQuestion}
    disabled={enriching || (manualMode === 'text' ? !manualText : !manualImage)}
>
    {enriching ? "✨ Analyzing..." : "✨ Analyze & Solve"}
</button>

{/* Review Section */ }
{
    enrichedData && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Review & Share</h4>

            <div className="form-group">
                <label className="label">Question Text</label>
                <textarea
                    className="input"
                    value={enrichedData.question_text}
                    onChange={(e) => setEnrichedData({ ...enrichedData, question_text: e.target.value })}
                    style={{ minHeight: '100px' }}
                />
            </div>

            <div className="form-group">
                <label className="label">Answer</label>
                <input
                    className="input"
                    value={enrichedData.correct_answer}
                    onChange={(e) => setEnrichedData({ ...enrichedData, correct_answer: e.target.value })}
                />
            </div>

            <div className="grid-2">
                <div className="form-group">
                    <label className="label">Hint (Stats)</label>
                    <textarea
                        className="input"
                        value={enrichedData.hint_stats}
                        onChange={(e) => setEnrichedData({ ...enrichedData, hint_stats: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="label">Solution (Stats)</label>
                    <textarea
                        className="input"
                        value={enrichedData.solution_stats}
                        onChange={(e) => setEnrichedData({ ...enrichedData, solution_stats: e.target.value })}
                        style={{ minHeight: '100px' }}
                    />
                </div>
            </div>

            <button className="btn" onClick={saveContribution} disabled={loading}>
                {loading ? "Sharing..." : "🚀 Share with Community"}
            </button>
        </div>
    )
}
            </div >
        </div >
    );
}
