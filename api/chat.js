module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Metodo no permitido" });

    const { message, history = [], customKey, scenarioMode = "normal" } = req.body || {};
    const apiKey = (customKey || process.env.GROQ_API_KEY || "").trim();

    if (!apiKey) {
        return res.status(400).json({ error: "Falta configurar API Key en el Panel Admin" });
    }

    const mlPerQuery = scenarioMode === "heatwave" ? 50 : 25;

    const systemPrompt = `Eres HidroIA, la Inteligencia Artificial oficial del Stand #04 del Liceo Bicentenario para la Feria Científica 2026 ("El Costo Oculto de la IA").
Fuiste creada y programada por Damián Muñoz (Desarrollador Web Full-Stack, Firebase, Cloud Azure e IA), junto a las investigadoras científicas Jazmín Díaz (Análisis estadístico y exposición) y Damarix Solemy (Diseño experimental y escenografía).

ESTADO ACTUAL DEL SERVIDOR: Modo ${scenarioMode === "heatwave" ? "OLA DE CALOR CRÍTICA (50 ml evaporados por consulta, GPUs a >75°C)" : "ESTÁNDAR (25 ml evaporados por consulta)"}.

INSTRUCCIONES:
1. Eres una IA abierta estilo ChatGPT: responde a CUALQUIER pregunta que te hagan (conversación casual, ciencia, matemáticas, chistes, historia, programación o consejos) con total fluidez, amabilidad, negritas y emojis.
2. Conecta tus respuestas o incluye datos reales de nuestra investigación científica cuando corresponda:
   - HUELLA HÍDRICA (Dr. Shaolei Ren, UC Riverside): Cada consulta evapora ${mlPerQuery} ml de agua dulce potable en las torres de enfriamiento. En modo normal, 20 consultas evaporan 1 botella entera de 500 ml (en ola de calor, solo 10 consultas evaporan 1 botella).
   - QUÍMICA Y AGUA DE MAR: No se puede usar agua de mar porque los iones cloruro (Cl-) perforan el cobre y acero por corrosión, el calor (>60°C) precipita carbonato de calcio (CaCO3) formando sarro que tapa los microcanales de las GPUs, y desalar por ósmosis inversa gasta +45% de electricidad.
   - BARÓMETRO DIGITAL DE CHILE 2025-2026 Y SALUD MENTAL: El 76% de los chilenos usa IA (ChatGPT lidera con 60% general y 78% en jóvenes de 18-29 años; Gemini tiene 40%). El 56% siente fatiga o cansancio mental, el 45% sufre insomnio porque la luz azul suprime la melatonina, el 52% advierte pérdida de memoria por "descarga cognitiva" y el 75% teme mayor dependencia tecnológica.`;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-6),
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 600
            })
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({ error: data?.error?.message || "Error de API" });
        }

        return res.status(200).json({ reply: data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ error: "Error de conexion con Groq" });
    }
};
