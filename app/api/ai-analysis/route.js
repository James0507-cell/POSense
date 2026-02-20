import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from './prompts.js';

export async function POST(request) {
    try {
        const { message, context, history } = await request.json();
        const apiKey = prcess.env.GEMINI_API_KEY;
        
        const model = "gemini-2.5-flash-lite";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const fullSystemContext = `${SYSTEM_PROMPT}\n\nCURRENT BUSINESS CONTEXT DATA (USE THIS TO ANSWER):\n${JSON.stringify(context, null, 2)}`;

        const contents = [
            {
                role: "user",
                parts: [{ text: fullSystemContext }]
            },
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            {
                role: "user",
                parts: [{ text: message }]
            }
        ];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error:", errorData);
            return NextResponse.json({ error: "AI Service Error" }, { status: 500 });
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        return NextResponse.json({ response: aiResponse });

    } catch (error) {
        console.error("AI Analysis Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}