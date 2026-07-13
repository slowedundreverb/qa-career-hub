import { collectJobs } from '../scripts/update-jobs.mjs';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST() {
  try {
    const result=await collectJobs();
    return Response.json({
      jobs:result.jobs,
      linkedinJobs:result.linkedinJobs,
      meta:result.meta,
      count:result.jobs.length,
      warnings:result.report.errors.length
    },{headers:{'cache-control':'no-store'}});
  } catch(error) {
    console.error('Job refresh failed',error);
    return Response.json({error:'Не удалось проверить источники вакансий'},{status:500});
  }
}
