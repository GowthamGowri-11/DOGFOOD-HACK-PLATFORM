import { redirect } from 'next/navigation';

export default function CompletedEvaluationsRedirect() {
  redirect('/judge/assignments?status=completed');
}
