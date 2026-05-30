export const CHIP_STYLES: Record<string, string> = {
  well_supported: 'wellSupported',
  strongly_supported: 'wellSupported',
  inferred: 'inferred',
  speculative: 'speculative',
  missing_context: 'missing',
  multiple_interpretations: 'speculative',
  limited_evidence: 'missing',
  requires_human_judgment: 'missing',
  weak_evidence: 'inferred',
  assumption: 'inferred',
};

export function chipDisplayLabel(label: string): string {
  const map: Record<string, string> = {
    well_supported: 'Well-supported',
    strongly_supported: 'Strongly supported',
    inferred: 'Inferred',
    speculative: 'Speculative',
    missing_context: 'Missing context',
    multiple_interpretations: 'Multiple interpretations',
    limited_evidence: 'Limited evidence',
    requires_human_judgment: 'Requires human judgment',
  };
  return map[label] ?? label.replace(/_/g, ' ');
}
