

import React, { useState, useEffect } from "react";
import { Search, Volume2 } from "lucide-react";

const WordHelper = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSwapped, setIsSwapped] = useState(false);

  const fetchWord = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    setTranslation(null);

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${query}`);

      if (!res.ok) {
        setError("Word not found. Try another one.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const wordData = data[0];

      const nounMeaning = wordData.meanings.find(m => m.partOfSpeech === "noun");

      if (nounMeaning) {
        nounMeaning.definitions = nounMeaning.definitions.slice(0, 1);
        const examples = nounMeaning.definitions
          .map(d => d.example)
          .filter(Boolean)
          .slice(0, 1);

        nounMeaning.examples = examples;
      }

      wordData.meanings = nounMeaning ? [nounMeaning] : [];

      if (wordData.phonetics?.length > 0) {
        const firstAudio = wordData.phonetics.find(p => p.audio) || wordData.phonetics[0];
        wordData.phonetics = [firstAudio];
      }

      setResult(wordData);
    } catch {
      setError("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  const playAudio = () => {
    const audio = result?.phonetics?.[0]?.audio;
    if (audio) new Audio(audio).play();
  };

  const translateToTagalog = async (text) => {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=en|tl`
      );
      const data = await res.json();
      return data.responseData.translatedText;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (!result) return;

    const doTranslate = async () => {
      const englishDef = result.meanings[0]?.definitions[0]?.definition || "";
      const englishExample = result.meanings[0]?.examples?.[0] || "";

      const wordTl = await translateToTagalog(result.word);
      const defTl = await translateToTagalog(englishDef);
      const exTl = englishExample ? await translateToTagalog(englishExample) : "";

      setTranslation({
        word: wordTl,
        definition: defTl,
        example: exTl
      });
    };

    doTranslate();
  }, [result]);

  return (
    <div className="min-h-screen bg-[#F9F3EA] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 overflow-hidden">
      <h1 className="text-3xl sm:text-3xl md:text-4xl font-bold text-center mt-10 md:mt-0">
        Word Helper
      </h1>

      <p className="text-center text-gray-700 mt-4 sm:mt-5 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl">
        Discover the meaning behind every word. Unlock <br /> knowledge with a single search.
      </p>

      <div className="flex flex-col md:flex-row items-center gap-3 justify-center mt-10 w-full max-w-2xl">
        <div className="flex items-center bg-white border border-gray-300 rounded-full px-6 py-3 w-full shadow-sm">
          <Search className="text-gray-500 mr-3" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") fetchWord(); }}
            placeholder="Search for a word..."
            className="w-full outline-none text-lg placeholder:text-gray-400 placeholder:opacity-70"
          />
        </div>

        <button
          onClick={fetchWord}
          className="bg-[#8B0015] hover:bg-[#6e0010] text-white px-4 py-2 rounded-md shadow text-base w-32 md:w-28"
        >
          Search
        </button>
      </div>

      <div className="mt-10 w-full max-w-5xl border border-gray-400 rounded-xl bg-white p-8 shadow">

        {!result && !loading && !error && (
          <div className="text-center">
            <img src="/src/assets/bulb.png" alt="lightbulb" className="w-14 mx-auto mb-6" />
            <h2 className="text-3xl font-semibold mb-5">Unlock the Power of Words</h2>
            <p className="text-gray-700 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
              Enter any word to instantly get its definition, pronunciation, and examples.
            </p>
          </div>
        )}

        {error && <p className="text-red-600 text-center text-xl">{error}</p>}
        {loading && <p className="text-gray-600 text-center text-xl">Searching…</p>}

        {result && (
          <div className="w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="px-4 py-2 rounded-md bg-[#8B0015] text-white font-semibold shadow">
                {isSwapped ? "Filipino" : "English"}
              </div>

              <button
                onClick={() => setIsSwapped(!isSwapped)}
                className="px-3 py-2 rounded-md text-white text-xl shadow"
                style={{ backgroundColor: "#8B0015" }}
              >
                ↔
              </button>

              <div className="px-4 py-2 rounded-md bg-[#8B0015] text-white font-semibold shadow">
                {isSwapped ? "English" : "Filipino"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!isSwapped ? (
                <>
                  <EnglishBox result={result} playAudio={playAudio} />
                  <TagalogBox translation={translation} />
                </>
              ) : (
                <>
                  <TagalogBox translation={translation} />
                  <EnglishBox result={result} playAudio={playAudio} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EnglishBox = ({ result, playAudio }) => (
  <div className="bg-white border border-black rounded-xl p-3 sm:p-5 shadow-sm h-44 sm:h-80 overflow-y-auto mb-3">
    <h3 className="text-lg md:text-2xl font-semibold mb-4">English</h3>

    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-lg md:text-2xl font-bold">{result.word}</h2>
      {result.phonetics?.[0]?.audio && (
        <button onClick={playAudio} className="text-blue-600">
          <Volume2 size={24} />
        </button>
      )}
    </div>

    {result.phonetic && (
      <p className="text-gray-600 mb-3 text-sm md:text-lg">{result.phonetic}</p>
    )}

    <p className="font-semibold mb-1 text-sm md:text-lg">Sentence Example</p>

    {result.meanings[0]?.examples?.length > 0 ? (
      <p className="text-gray-700 mb-1 text-sm md:text-lg">“{result.meanings[0].examples[0]}”</p>
    ) : (
      <p className="text-gray-500 text-sm md:text-lg">No examples available.</p>
    )}

    <p className="font-semibold mt-4 capitalize text-sm md:text-lg">{result.meanings[0].partOfSpeech}</p>
    <p className="text-gray-900 mt-1 text-sm md:text-lg">• {result.meanings[0].definitions[0].definition}</p>
  </div>
);

const TagalogBox = ({ translation }) => (
  <div className="bg-white border border-black rounded-xl p-3 sm:p-5 shadow-sm h-44 sm:h-80 overflow-y-auto mb-3">
    <h3 className="text-lg md:text-2xl font-semibold mb-4">Filipino</h3>

    {!translation ? (
      <p className="text-gray-500 text-sm md:text-lg">Translating...</p>
    ) : (
      <div>
        <p className="font-semibold text-sm md:text-lg">Salita:</p>
        <p className="text-gray-800 mb-3 text-sm md:text-lg">{translation.word}</p>

        <p className="font-semibold text-sm md:text-lg">Kahulugan:</p>
        <p className="text-gray-800 mb-3 text-sm md:text-lg">{translation.definition}</p>

        <p className="font-semibold text-sm md:text-lg">Halimbawa:</p>
        {translation.example ? (
          <p className="text-gray-800 mt-1 text-sm md:text-lg">“{translation.example}”</p>
        ) : (
          <p className="text-gray-500 mt-1 text-sm md:text-lg">Walang halimbawa.</p>
        )}
      </div>
    )}
  </div>
);

export default WordHelper;
