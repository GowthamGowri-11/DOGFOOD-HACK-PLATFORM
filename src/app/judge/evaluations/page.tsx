import { redirect } from 'next/navigation';

export default function PendingEvaluationsRedirect() {
  redirect('/judge/assignments?status=pending');
}
