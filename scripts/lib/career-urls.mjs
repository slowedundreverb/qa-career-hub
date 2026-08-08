const directJobQueryKeys=new Set([
  'gh_jid','jobid','job_id','job','jid','positionid','position_id','requisitionid','requisition_id','reqid','req_id'
]);

export function isLikelyDirectJobUrl(value) {
  try {
    const url=new URL(value);
    const host=url.hostname.replace(/^www\./,'').toLowerCase();
    const path=decodeURIComponent(url.pathname).replace(/\/+$/,'');
    const segments=path.split('/').filter(Boolean);
    const keys=[...url.searchParams.keys()].map(key=>key.toLowerCase());

    if(keys.some(key=>directJobQueryKeys.has(key))) return true;
    if(/\/(?:job-?posting|job-?details?)(?:\/|$)/i.test(path)) return true;
    if(/\/(?:jobs?|vacanc(?:y|ies)|positions?|roles?)\/(?:[a-f\d-]{8,}|r\d{5,}|\d{5,}|[^/]*\d{5,}[^/]*)$/i.test(path)) return true;
    if(/myworkdayjobs\.com$/i.test(host)&&/\/job\//i.test(path)) return true;
    if(/jobs\.lever\.co$/i.test(host)&&segments.length>=2) return true;
    if(/jobs\.ashbyhq\.com$/i.test(host)&&segments.length>=2&&/[a-f\d-]{20,}/i.test(segments.at(-1))) return true;
    if(/jobs\.smartrecruiters\.com$/i.test(host)&&segments.length>=2&&/^\d{6,}/.test(segments.at(-1))) return true;
    if(/greenhouse\.io$/i.test(host)&&/\/jobs\/\d+/i.test(path)) return true;
    return false;
  } catch {
    return true;
  }
}
