import { getCurrentUser } from './auth_v1.js';

const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const resultEl = document.getElementById("result");
const uploadButton = document.getElementById("uploadButton");
const spinner = document.getElementById("spinner");
const dropArea = document.getElementById("dropArea");
const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");
const removePreview = document.getElementById("removePreview");
const fileName = document.getElementById("fileName");
const copyButton = document.getElementById("copyButton");

// 파일 드래그 앤 드롭 기능
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
  dropArea.style.borderColor = "#4361ee";
  dropArea.style.backgroundColor = "rgba(67, 97, 238, 0.05)";
}

function unhighlight() {
  dropArea.style.borderColor = "#ddd";
  dropArea.style.backgroundColor = "";
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length) {
    fileInput.files = files;
    updateFilePreview(files[0]);
  }
}

// 파일 선택 시 미리보기
fileInput.addEventListener('change', function () {
  if (this.files.length) {
    updateFilePreview(this.files[0]);
  }
});

function updateFilePreview(file) {
  if (!file.type.match('image.*')) {
    alert('이미지 파일만 업로드 가능합니다.');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    previewImage.src = e.target.result;
    fileName.textContent = file.name;
    previewContainer.style.display = 'block';
    dropArea.style.display = 'none';
  };

  reader.readAsDataURL(file);
}

// 미리보기 제거
removePreview.addEventListener('click', function () {
  previewContainer.style.display = 'none';
  dropArea.style.display = 'flex';
  fileInput.value = '';
});

async function resizeImage(file, maxSize = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        resolve(resizedFile);
      }, "image/jpeg", 0.85);
    };

    reader.readAsDataURL(file);
  });
}

// 결과 복사 기능
copyButton.addEventListener('click', function () {
  const text = resultEl.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const originalIcon = copyButton.innerHTML;
    copyButton.innerHTML = '<i class="fas fa-check" style="color: #4CAF50;"></i>';

    setTimeout(() => {
      copyButton.innerHTML = originalIcon;
    }, 2000);
  }).catch(err => {
    console.error('클립보드 복사 실패:', err);
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 로그인 상태 확인
  const currentUser = getCurrentUser();
  if (!currentUser) {
    resultEl.innerHTML = '<span class="result-error">로그인이 필요합니다.</span>';
    return;
  }

  if (!fileInput.files.length) {
    resultEl.innerHTML = '<span class="result-error">이미지를 선택해 주세요.</span>';
    return;
  }

  resultEl.innerHTML = '<span class="result-placeholder">처리 중입니다. 약 30초 가량 소요될 수 있습니다...</span>';
  uploadButton.disabled = true;
  spinner.style.display = 'inline-block';

  try {
    const originalFile = fileInput.files[0];
    const resizedFile = await resizeImage(originalFile);

    const formData = new FormData();
    formData.append("image", resizedFile);

    const res = await fetch(
      "https://primary-production-628d.up.railway.app/webhook/bebd1982-06c0-4488-9086-1466e40e471b",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error(`서버 응답 오류: ${res.status}`);
    }

    const data = await res.json();
    const content = data[0]?.message?.content || "결과 없음";
    resultEl.innerHTML = `<span class="result-success">${content}</span>`;

  } catch (error) {
    resultEl.innerHTML = `<span class="result-error">⚠️ 오류 발생: ${error.message}</span>`;
  } finally {
    uploadButton.disabled = false;
    spinner.style.display = 'none';
  }
});
