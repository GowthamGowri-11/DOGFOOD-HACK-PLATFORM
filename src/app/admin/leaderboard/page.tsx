import { redirect } from 'next/navigation';

export default function AdminLeaderboardRedirect() {
  redirect('/admin/results');
}
