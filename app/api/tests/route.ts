import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { requireSession, requireTeacher } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("tests").select("*").order("test_date", { ascending: true });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireTeacher(request);
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const { subject, title, testDate, durationMinutes, maxMarks, syllabus } = body;

    if (!subject || !title || !testDate) {
      return NextResponse.json({ success: false, error: "Subject, title, and testDate are required." }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("tests")
        .insert([
          {
            subject,
            title,
            test_date: testDate,
            duration_minutes: durationMinutes || 60,
            max_marks: maxMarks || 100,
            syllabus: syllabus || "",
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
        data: {
          id: `test-${Date.now()}`,
          subject,
          title,
          testDate,
          durationMinutes: durationMinutes || 60,
          maxMarks: maxMarks || 100,
          syllabus,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
