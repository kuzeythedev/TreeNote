import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkspaceLocale = "tr" | "en";
export type WorkspaceTheme = "light" | "dark";

export type RemoteWorkspace<Page> = {
  locale: WorkspaceLocale;
  pages: Page[];
  theme: WorkspaceTheme;
};

type WorkspaceRow<Page> = {
  locale: WorkspaceLocale;
  pages: Page[];
  theme: WorkspaceTheme;
};

export async function loadWorkspace<Page>(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("note_workspaces")
    .select("pages, locale, theme")
    .eq("user_id", userId)
    .maybeSingle<WorkspaceRow<Page>>();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveWorkspace<Page>(
  supabase: SupabaseClient,
  userId: string,
  workspace: RemoteWorkspace<Page>,
) {
  const { error } = await supabase.from("note_workspaces").upsert({
    locale: workspace.locale,
    pages: workspace.pages,
    theme: workspace.theme,
    user_id: userId,
  });

  if (error) {
    throw error;
  }
}
