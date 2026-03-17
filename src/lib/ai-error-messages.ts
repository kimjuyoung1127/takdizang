/** AI 드롭/생성 에러 메시지 (한국어) */

const IMAGE_FIELDS = new Set(["imageUrl", "posterUrl", "images"]);
const TEXT_FIELDS = new Set([
  "heading", "body", "text", "subtext", "buttonLabel",
  "title", "headline", "description", "question", "answer",
  "label", "value", "badge", "expiresLabel",
]);

function isImageField(fieldName: string): boolean {
  return IMAGE_FIELDS.has(fieldName) || fieldName.toLowerCase().includes("image") || fieldName.toLowerCase().includes("url");
}

function isTextField(fieldName: string): boolean {
  return TEXT_FIELDS.has(fieldName) || !isImageField(fieldName);
}

export function getAiDropErrorMessage(resultType: string, fieldName: string): string {
  if (resultType === "text" && isImageField(fieldName)) {
    return "텍스트 결과는 이미지 필드에 적용할 수 없어요";
  }
  if (resultType === "image" && isTextField(fieldName)) {
    return "이미지 결과는 텍스트 필드에 적용할 수 없어요";
  }
  return "이 위치에는 놓을 수 없어요";
}

export function getAiGenerateErrorMessage(status: number, message: string): string {
  if (status === 429 && message.includes("월간")) return "이번 달 무료 사용량을 초과했어요";
  if (status === 429) return "요청이 너무 많아요. 잠시 후 다시 시도해주세요";
  if (status === 500) return "AI 서버에 문제가 생겼어요. 다시 시도해주세요";
  return "AI 생성에 실패했어요. 다시 시도해주세요";
}
