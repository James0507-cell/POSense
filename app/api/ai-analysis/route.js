import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { message, context, history } = await request.json();
        const apiKey = "AIzaSyD5gCmAenHXfTbScPqC09PEb-4FR0X_ilE";
        
        // Using Gemini 2.0 Flash Lite Preview (as requested or latest available flash lite)
        const model = "gemini-2.0-flash-lite-preview-02-05";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const systemPrompt = `You are an AI Business Analyst for POSense, a modern Point of Sale and Inventory Management system.
Your goal is to provide deep insights based on the provided business data (products and inventory).

DATA CONTEXT:
${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
1. Use the provided context to answer questions accurately.
2. If asked about stock levels, check the 'total_stock' and 'minimum' values.
3. If asked about growth, refer to 'created_at' dates.
4. Be concise, professional, and data-driven.
5. If data is missing for a specific query, state it clearly.
6. Use formatting (bolding, lists) to make insights readable.`;

        const contents = [
            {
                role: "user",
                parts: [{ text: systemPrompt }]
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