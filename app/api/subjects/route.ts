import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { requireSession, requireTeacher } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("subjects").select("*").order("name");
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({
      success: true,
      message: "Running in local/demo mode.",
      data: [
        { id: "1", name: "Math", color: "#3b82f6" },
        { id: "2", name: "Science", color: "#10b981" },
        { id: "3", name: "History", color: "#f59e0b" },
        { id: "4", name: "English", color: "#8b5cf6" },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireTeacher(request);
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const { name, code, color } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Subject name is required." }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("subjects")
        .insert([{ name, code, color: color || "#3b82f6" }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: `sub-${Date.now()}`, name, code, color: color || "#3b82f6" },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
