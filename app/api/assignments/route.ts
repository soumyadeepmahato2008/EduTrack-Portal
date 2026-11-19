import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { requireSession, requireTeacher } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from("assignments").select("*").order("due_date", { ascending: true });
      if (subject) {
        query = query.eq("subject", subject);
      }
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // Default mock response when Supabase is not yet configured
    return NextResponse.json({
      success: true,
      message: "Running in local/demo mode. Provide Supabase credentials to sync directly with PostgreSQL.",
      data: [],
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
    const { subject, title, dueDate, priority, description } = body;

    if (!subject || !title || !dueDate) {
      return NextResponse.json(
        { success: false, error: "Subject, title, and dueDate are required fields." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("assignments")
        .insert([
          {
            subject,
            title,
            due_date: dueDate,
            priority: priority || "Medium",
            description,
            created_by_teacher_id: auth.session?.email,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Assignment received in demo mode.",
        data: {
          id: `asg-${Date.now()}`,
          subject,
          title,
          dueDate,
          priority: priority || "Medium",
          description,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
