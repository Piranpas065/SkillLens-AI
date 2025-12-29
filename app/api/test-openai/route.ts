import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, who won the cricket World Cup 2023?" },
      ],
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
