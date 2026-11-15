import { cookies } from 'next/headers';
import { cookieName, validSession } from './session';

export async function canManage() {
  return validSession((await cookies()).get(cookieName)?.value);
}
