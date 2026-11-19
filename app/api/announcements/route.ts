import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { requireSession, requireTeacher } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
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
    const { title, content, subject, isPinned, author } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required." }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("announcements")
        .insert([
          {
            title,
            content,
            subject: subject || "General",
            is_pinned: isPinned || false,
            created_by: auth.session?.email,
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
          id: `ann-${Date.now()}`,
          title,
          content,
          subject: subject || "General",
          isPinned: isPinned || false,
          author: author || "Teacher",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
