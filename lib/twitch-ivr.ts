import { ofetch } from "ofetch";

// Описания типов api.ivr.fi — апи слабо типизировано, берём только нужные поля.

export type IvrUser = {
  id: string;
  login: string;
  displayName: string;
  logo?: string;
  followers?: number | null;
  createdAt?: string;
  roles?: {
    isAffiliate?: boolean;
    isPartner?: boolean;
    isStaff?: boolean | null;
  };
};

export type Relation = {
  followedAt?: string;
  subMonths?: number;
  subEnd?: string;
};

type IvrSubageResponse = {
  followedAt?: string | null;
  cumulative?: {
    months?: number | null;
    end?: string | null;
  } | null;
};

const IVR_BASE = "https://api.ivr.fi/v2/twitch";

// Грузим профили пачками по 25 id, ошибки игнорируем.
export async function fetchIvrUsers(ids: string[]): Promise<IvrUser[]> {
  if (!ids.length) return [];
  const chunkSize = 25;
  const out: IvrUser[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    try {
      const res = await ofetch<IvrUser[]>(`${IVR_BASE}/user?id=${chunk.join(",")}`);
      if (Array.isArray(res)) {
        for (const u of res) out.push(u);
      }
    } catch {
      /* ignore */
    }
  }
  return out;
}

// Пробуем login, если не нашли и term не числовой — пробуем id.
export async function fetchIvrUserByLoginOrId(term: string): Promise<IvrUser | null> {
  const value = term.trim();
  if (!value) return null;
  const isId = /^\d+$/.test(value);
  const primaryUrl = isId
    ? `${IVR_BASE}/user?id=${encodeURIComponent(value)}`
    : `${IVR_BASE}/user?login=${encodeURIComponent(value)}`;
  let res = await ofetch<IvrUser[]>(primaryUrl);
  if ((!res || !res.length) && !isId) {
    res = await ofetch<IvrUser[]>(`${IVR_BASE}/user?id=${encodeURIComponent(value)}`);
  }
  return res?.[0] ?? null;
}

// Безопасный запрос subage — на любую ошибку возвращаем пустой объект.
export async function fetchIvrSubage(login: string, channel: string): Promise<Relation> {
  try {
    const res = await ofetch<IvrSubageResponse>(
      `${IVR_BASE}/subage/${login}/${channel}`,
    );
    return {
      followedAt: res?.followedAt || undefined,
      subMonths: res?.cumulative?.months ?? undefined,
      subEnd: res?.cumulative?.end || undefined,
    };
  } catch {
    return {};
  }
}
