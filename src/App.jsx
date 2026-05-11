import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const defaultUsers = [
  { id: "GUN", name: "GUN", mark: "G", role: "admin" },
  { id: "EUN", name: "EUN", mark: "E", role: "user" },
];

const defaultCrops = [
  { id: 1, name: "고추", memo: "비료 주기 확인 필요", lastWork: "물주기" },
  { id: 2, name: "토마토", memo: "지지대 확인", lastWork: "방제" },
  { id: 3, name: "상추", memo: "수확 가능", lastWork: "수확" },
];

const quickWorks = ["물주기", "비료", "방제", "수확"];
const workTypes = ["물주기", "비료", "파종", "정식", "방제", "수확", "기타"];
const weatherTypes = ["맑음", "흐림", "비", "눈", "바람 많음"];

function fromDiaryRow(row) {
  return {
    id: row.id,
    date: row.date,
    crop: row.crop,
    workType: row.work_type,
    weather: row.weather,
    content: row.content,
    memo: row.memo || "",
    harvestAmount: row.harvest_amount || "",
    imageUrl: row.image_url || "",
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
    authorId: row.author_id || "",
    authorMark: row.author_mark || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDiaryRow(diary) {
  return {
    id: diary.id,
    date: diary.date,
    crop: diary.crop,
    work_type: diary.workType,
    weather: diary.weather,
    content: diary.content,
    memo: diary.memo || null,
    harvest_amount: diary.harvestAmount || null,
    image_url: diary.imageUrl || null,
    image_urls: diary.imageUrls || [],
    author_id: diary.authorId || null,
    author_mark: diary.authorMark || null,
    created_at: diary.createdAt || new Date().toISOString(),
    updated_at: diary.updatedAt || null,
  };
}

function App() {
  const [activeTab, setActiveTab] = useState("home");

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("farm-current-user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem("farm-users");

    if (!savedUsers) {
      return defaultUsers;
    }

    try {
      return JSON.parse(savedUsers);
    } catch {
      return defaultUsers;
    }
  });

  const [editingDiary, setEditingDiary] = useState(null);
  const [selectedQuickWork, setSelectedQuickWork] = useState(null);

  const [crops, setCrops] = useState(() => {
    const savedCrops = localStorage.getItem("farm-crops");

    if (!savedCrops) {
      return defaultCrops;
    }

    try {
      return JSON.parse(savedCrops);
    } catch {
      return defaultCrops;
    }
  });

  const [diaries, setDiaries] = useState([]);

  async function loadDiaries() {
    const { data, error } = await supabase
      .from("diaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("농사일지 불러오기 실패:", error);
      alert("농사일지를 불러오지 못했습니다.");
      return;
    }

    setDiaries(data.map(fromDiaryRow));
  }

  useEffect(() => {
    loadDiaries();
  }, []);

  function saveUsers(nextUsers) {
    setUsers(nextUsers);
    localStorage.setItem("farm-users", JSON.stringify(nextUsers));
  }

  function addUser(userId) {
    const trimmedUserId = userId.trim().toUpperCase();

    if (!trimmedUserId) {
      alert("아이디를 입력해주세요.");
      return;
    }

    const alreadyExists = users.some((user) => user.id === trimmedUserId);

    if (alreadyExists) {
      alert("이미 등록된 아이디입니다.");
      return;
    }

    const newUser = {
      id: trimmedUserId,
      name: trimmedUserId,
      mark: trimmedUserId.slice(0, 1),
      role: "user",
    };

    saveUsers([...users, newUser]);
  }

  function loginUser(userId) {
    const trimmedUserId = userId.trim().toUpperCase();

    if (!trimmedUserId) {
      alert("아이디를 입력해주세요.");
      return;
    }

    const matchedUser = users.find((user) => user.id === trimmedUserId);

    if (!matchedUser) {
      alert("등록된 아이디가 아닙니다. 관리자에게 아이디 추가를 요청하세요.");
      return;
    }

    setCurrentUser(matchedUser);
    localStorage.setItem("farm-current-user", JSON.stringify(matchedUser));
  }

  function logoutUser() {
    const isConfirmed = confirm("사용자를 변경할까요?");

    if (!isConfirmed) {
      return;
    }

    setCurrentUser(null);
    localStorage.removeItem("farm-current-user");
    setActiveTab("home");
  }

  function saveCrops(nextCrops) {
    setCrops(nextCrops);
    localStorage.setItem("farm-crops", JSON.stringify(nextCrops));
  }

  function startQuickWrite(workType) {
    setEditingDiary(null);
    setSelectedQuickWork(workType || "물주기");
    setActiveTab("write");
  }

  async function addDiary(newDiary) {
    const { error } = await supabase.from("diaries").insert(toDiaryRow(newDiary));

    if (error) {
      console.error("농사일지 저장 실패:", error);
      alert("농사일지를 저장하지 못했습니다.");
      return;
    }

    setDiaries((prevDiaries) => [newDiary, ...prevDiaries]);
    setActiveTab("list");
  }

  function startEditDiary(diary) {
    setEditingDiary(diary);
    setSelectedQuickWork(null);
    setActiveTab("write");
  }

  async function updateDiary(updatedDiary) {
    const { error } = await supabase
      .from("diaries")
      .update(toDiaryRow(updatedDiary))
      .eq("id", updatedDiary.id);

    if (error) {
      console.error("농사일지 수정 실패:", error);
      alert("농사일지를 수정하지 못했습니다.");
      return;
    }

    setDiaries((prevDiaries) =>
      prevDiaries.map((diary) =>
        diary.id === updatedDiary.id ? updatedDiary : diary
      )
    );

    setEditingDiary(null);
    setSelectedQuickWork(null);
    setActiveTab("list");
  }

  function cancelEditDiary() {
    setEditingDiary(null);
    setSelectedQuickWork(null);
    setActiveTab("list");
  }

  async function deleteDiary(id) {
    const isConfirmed = confirm("이 농사일지를 삭제할까요?");

    if (!isConfirmed) {
      return;
    }

    const { error } = await supabase.from("diaries").delete().eq("id", id);

    if (error) {
      console.error("농사일지 삭제 실패:", error);
      alert("농사일지를 삭제하지 못했습니다.");
      return;
    }

    setDiaries((prevDiaries) => prevDiaries.filter((diary) => diary.id !== id));
  }

  function addCrop(cropName) {
    const trimmedName = cropName.trim();

    if (!trimmedName) {
      alert("작물명을 입력해주세요.");
      return;
    }

    const alreadyExists = crops.some((crop) => crop.name === trimmedName);

    if (alreadyExists) {
      alert("이미 등록된 작물입니다.");
      return;
    }

    const newCrop = {
      id: Date.now(),
      name: trimmedName,
      memo: "새로 추가한 작물",
      lastWork: "기록 없음",
    };

    saveCrops([...crops, newCrop]);
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const isQuickWorkTab = workTypes.includes(activeTab);
  const currentScreen = isQuickWorkTab ? "write" : activeTab;
  const currentQuickWork = isQuickWorkTab ? activeTab : selectedQuickWork;

  if (!currentUser) {
    return <LoginScreen loginUser={loginUser} users={users} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl bg-white">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 md:block">
          <div className="mb-8">
            <p className="text-sm text-slate-500">{today}</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">농사일지</h1>
          </div>

          <SidebarNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            logoutUser={logoutUser}
          />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 md:hidden">
            <p className="text-sm text-slate-500">{today}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">농사일지</h1>
          </header>

          <main className="flex-1 px-5 py-5 pb-24 md:px-8 lg:px-10">
            {currentScreen === "home" && (
              <Dashboard
                setActiveTab={setActiveTab}
                startQuickWrite={startQuickWrite}
                startEditDiary={startEditDiary}
                diaries={diaries}
                crops={crops}
              />
            )}

            {currentScreen === "write" && (
              <DiaryForm
                addDiary={addDiary}
                updateDiary={updateDiary}
                editingDiary={editingDiary}
                cancelEditDiary={cancelEditDiary}
                setActiveTab={setActiveTab}
                crops={crops}
                selectedQuickWork={currentQuickWork}
                setSelectedQuickWork={setSelectedQuickWork}
                currentUser={currentUser}
              />
            )}

            {currentScreen === "list" && (
              <DiaryList
                diaries={diaries}
                deleteDiary={deleteDiary}
                startEditDiary={startEditDiary}
                crops={crops}
              />
            )}

            {currentScreen === "crops" && (
              <CropManage diaries={diaries} crops={crops} addCrop={addCrop} />
            )}

            {currentScreen === "users" && currentUser.role === "admin" && (
              <UserManage users={users} addUser={addUser} />
            )}
          </main>

          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </div>
  );
}

function Dashboard({ setActiveTab, startQuickWrite, startEditDiary, diaries, crops }) {
  const recentDiaries = diaries.slice(0, 5);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyDiaries = diaries.filter((diary) => {
    const diaryDate = new Date(diary.date);
    return (
      diaryDate.getFullYear() === currentYear &&
      diaryDate.getMonth() === currentMonth
    );
  });

  const harvestDiaries = diaries.filter((diary) => diary.workType === "수확");

  const stats = [
    { label: "전체 기록", value: `${diaries.length}건` },
    { label: "이번 달 기록", value: `${monthlyDiaries.length}건` },
    { label: "수확 기록", value: `${harvestDiaries.length}건` },
    { label: "등록 작물", value: `${crops.length}개` },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">오늘 작업을 빠르게 기록하세요</p>
        <h2 className="mt-2 text-xl font-semibold">오늘 농사일지 작성</h2>

        <button
          onClick={() => startQuickWrite("물주기")}
          className="mt-5 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 md:w-auto md:px-8"
        >
          + 오늘 일지 작성하기
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">빠른 작업</h2>

          <div className="grid grid-cols-2 gap-3">
            {quickWorks.map((work) => (
              <button
                key={work}
                onClick={() => startQuickWrite(work)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm active:scale-[0.98]"
              >
                <span className="text-lg font-semibold text-slate-900">{work}</span>
                <p className="mt-1 text-sm text-slate-500">바로 기록하기</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">최근 기록</h2>
            <button
              onClick={() => setActiveTab("list")}
              className="text-sm font-medium text-slate-500"
            >
              전체보기
            </button>
          </div>

          <div className="space-y-3">
            {recentDiaries.length === 0 ? (
              <EmptyBox message="아직 저장된 농사일지가 없습니다." />
            ) : (
              recentDiaries.map((diary) => (
                <DiaryCard
                  key={diary.id}
                  diary={diary}
                  startEditDiary={startEditDiary}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">작물</h2>
          <button
            onClick={() => setActiveTab("crops")}
            className="text-sm font-medium text-slate-500"
          >
            관리
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {crops.map((crop) => (
            <CropCard key={crop.id} crop={crop} diaries={diaries} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DiaryForm({
  addDiary,
  updateDiary,
  editingDiary,
  cancelEditDiary,
  setActiveTab,
  crops,
  selectedQuickWork = null,
  setSelectedQuickWork = () => {},
  currentUser,
}) {
  const firstCropName = crops.length > 0 ? crops[0].name : "";
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [listeningTarget, setListeningTarget] = useState("");

  const [form, setForm] = useState({
    date: editingDiary ? editingDiary.date : new Date().toISOString().slice(0, 10),
    crop: editingDiary ? editingDiary.crop : firstCropName,
    workType: editingDiary ? editingDiary.workType : selectedQuickWork || "물주기",
    weather: editingDiary ? editingDiary.weather : "맑음",
    content: editingDiary ? editingDiary.content : "",
    memo: editingDiary ? editingDiary.memo : "",
    harvestAmount: editingDiary ? editingDiary.harvestAmount || "" : "",
    imageUrl: editingDiary ? editingDiary.imageUrl || "" : "",
    imageUrls: editingDiary ? editingDiary.imageUrls || [] : [],
  });

  const isEditMode = Boolean(editingDiary);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  function startVoiceInput(fieldName) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("이 브라우저에서는 음성 입력을 지원하지 않습니다. Chrome 또는 Edge에서 시도해보세요.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setListeningTarget(fieldName);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      setForm((prevForm) => {
        const previousText = prevForm[fieldName] || "";
        const nextText = previousText ? `${previousText} ${transcript}` : transcript;

        return {
          ...prevForm,
          [fieldName]: nextText,
        };
      });
    };

    recognition.onerror = (event) => {
      console.error("음성 입력 오류:", event.error);
      alert("음성 입력 중 오류가 발생했습니다.");
    };

    recognition.onend = () => {
      setIsListening(false);
      setListeningTarget("");
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("음성 입력 시작 실패:", error);
      setIsListening(false);
      setListeningTarget("");
    }
  }

  async function uploadPhotosIfNeeded() {
    const existingImageUrls = Array.isArray(form.imageUrls)
      ? form.imageUrls
      : form.imageUrl
        ? [form.imageUrl]
        : [];

    if (!Array.isArray(photoFiles) || photoFiles.length === 0) {
      return existingImageUrls;
    }

    const uploadedUrls = [];

    for (const photoFile of photoFiles) {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `diaries/${fileName}`;

      const { error } = await supabase.storage
        .from("diary-photos")
        .upload(filePath, photoFile);

      if (error) {
        console.error("사진 업로드 실패:", error);
        alert("사진을 업로드하지 못했습니다.");
        return existingImageUrls;
      }

      const { data } = supabase.storage
        .from("diary-photos")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return [...existingImageUrls, ...uploadedUrls];
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.crop) {
      alert("작물을 먼저 추가해주세요.");
      return;
    }

    if (!form.content.trim()) {
      alert("작업 내용을 입력해주세요.");
      return;
    }

    const imageUrls = await uploadPhotosIfNeeded();
    const imageUrl = imageUrls[0] || "";

    if (isEditMode) {
      const updatedDiary = {
        ...editingDiary,
        ...form,
        imageUrl,
        imageUrls,
        updatedAt: new Date().toISOString(),
      };

      await updateDiary(updatedDiary);
      setSelectedQuickWork(null);
      return;
    }

    const newDiary = {
      id: Date.now(),
      ...form,
      imageUrl,
      imageUrls,
      authorId: currentUser.id,
      authorMark: currentUser.mark,
      createdAt: new Date().toISOString(),
    };

    await addDiary(newDiary);
    setSelectedQuickWork(null);

    setForm({
      date: new Date().toISOString().slice(0, 10),
      crop: firstCropName,
      workType: "물주기",
      weather: "맑음",
      content: "",
      memo: "",
      harvestAmount: "",
      imageUrl: "",
      imageUrls: [],
    });

    setPhotoFiles([]);
  }

  function handleCancel() {
    setSelectedQuickWork(null);

    if (isEditMode) {
      cancelEditDiary();
      return;
    }

    setActiveTab("home");
  }

  const selectedPhotoCount = Array.isArray(photoFiles) ? photoFiles.length : 0;

  const existingImageUrls = Array.isArray(form.imageUrls)
    ? form.imageUrls
    : form.imageUrl
      ? [form.imageUrl]
      : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          {isEditMode ? "농사일지 수정" : "농사일지 작성"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEditMode
            ? "기존 기록을 수정한 뒤 저장하세요."
            : "날짜, 작물, 작업 종류를 고르고 작업 내용을 빠르게 남기세요."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="날짜">
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
            />
          </Field>

          <Field label="작물">
            <select
              name="crop"
              value={form.crop}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
            >
              {crops.map((crop) => (
                <option key={crop.id} value={crop.name}>
                  {crop.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="작업 종류">
            <select
              name="workType"
              value={form.workType}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
            >
              {workTypes.map((workType) => (
                <option key={workType} value={workType}>
                  {workType}
                </option>
              ))}
            </select>
          </Field>

          <Field label="날씨">
            <select
              name="weather"
              value={form.weather}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
            >
              {weatherTypes.map((weather) => (
                <option key={weather} value={weather}>
                  {weather}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {form.workType === "수확" && (
          <Field label="수확량">
            <input
              name="harvestAmount"
              value={form.harvestAmount}
              onChange={handleChange}
              placeholder="예: 5kg, 20개, 3박스"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
            />
          </Field>
        )}

        <Field label="작업 내용">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => startVoiceInput("content")}
              disabled={isListening}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {isListening && listeningTarget === "content" ? "듣는 중..." : "음성 입력"}
            </button>
          </div>

          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            rows="5"
            placeholder="예: 오전에 고추밭 물주기 완료"
            className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
          />
        </Field>

        <Field label="사진 첨부">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              setPhotoFiles(files);
            }}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
          />

          {selectedPhotoCount > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              선택한 사진: {selectedPhotoCount}장
            </p>
          )}

          {selectedPhotoCount === 0 && existingImageUrls.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-sm text-slate-500">기존 사진</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {existingImageUrls.map((imageUrl) => (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt="기존 농사일지 사진"
                    className="h-32 w-full rounded-2xl border border-slate-200 object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </Field>

        <Field label="메모">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => startVoiceInput("memo")}
              disabled={isListening}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {isListening && listeningTarget === "memo" ? "듣는 중..." : "음성 입력"}
            </button>
          </div>

          <textarea
            name="memo"
            value={form.memo}
            onChange={handleChange}
            rows="3"
            placeholder="예: 잎 색이 조금 연함. 다음 주 비료 확인"
            className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
          />
        </Field>

        <div className="flex flex-col gap-3 md:flex-row">
          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white active:scale-[0.98] md:w-auto md:px-10"
          >
            {isEditMode ? "수정 저장" : "저장하기"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-600 md:w-auto md:px-10"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

function DiaryList({ diaries, deleteDiary, startEditDiary, crops }) {
  const [searchText, setSearchText] = useState("");
  const [cropFilter, setCropFilter] = useState("전체 작물");
  const [workFilter, setWorkFilter] = useState("전체 작업");

  const filteredDiaries = diaries.filter((diary) => {
    const matchesSearch =
      diary.crop.includes(searchText) ||
      diary.workType.includes(searchText) ||
      diary.content.includes(searchText) ||
      diary.memo.includes(searchText);

    const matchesCrop = cropFilter === "전체 작물" || diary.crop === cropFilter;
    const matchesWork = workFilter === "전체 작업" || diary.workType === workFilter;

    return matchesSearch && matchesCrop && matchesWork;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">일지 목록</h2>
        <p className="mt-1 text-sm text-slate-500">
          저장된 농사일지를 검색하고 필터링합니다.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="작물명, 작업 종류, 내용 검색"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
        />

        <select
          value={cropFilter}
          onChange={(event) => setCropFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
        >
          <option>전체 작물</option>
          {crops.map((crop) => (
            <option key={crop.id}>{crop.name}</option>
          ))}
        </select>

        <select
          value={workFilter}
          onChange={(event) => setWorkFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
        >
          <option>전체 작업</option>
          {workTypes.map((workType) => (
            <option key={workType}>{workType}</option>
          ))}
        </select>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">총 {filteredDiaries.length}개의 기록</p>
      </div>

      <div className="space-y-3">
        {filteredDiaries.length === 0 ? (
          <EmptyBox message="조건에 맞는 농사일지가 없습니다." />
        ) : (
          filteredDiaries.map((diary) => (
            <DiaryCard
              key={diary.id}
              diary={diary}
              deleteDiary={deleteDiary}
              startEditDiary={startEditDiary}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CropManage({ diaries, crops, addCrop }) {
  const [cropName, setCropName] = useState("");

  function handleAddCrop(event) {
    event.preventDefault();
    addCrop(cropName);
    setCropName("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">작물 관리</h2>
        <p className="mt-1 text-sm text-slate-500">
          작물을 추가하고, 작물별 최근 작업과 기록 수를 확인합니다.
        </p>
      </div>

      <form
        onSubmit={handleAddCrop}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label className="text-sm font-semibold text-slate-700">새 작물 추가</label>

        <div className="mt-3 flex flex-col gap-3 md:flex-row">
          <input
            value={cropName}
            onChange={(event) => setCropName(event.target.value)}
            placeholder="예: 오이, 가지, 배추"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
          />

          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            추가
          </button>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {crops.map((crop) => (
          <CropCard key={crop.id} crop={crop} diaries={diaries} />
        ))}
      </div>
    </div>
  );
}

function CropCard({ crop, diaries }) {
  const cropDiaries = diaries.filter((diary) => diary.crop === crop.name);
  const latestDiary = cropDiaries[0];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{crop.name}</h3>

          <p className="mt-1 text-sm text-slate-500">
            최근 작업: {latestDiary ? latestDiary.workType : crop.lastWork}
          </p>

          <p className="mt-2 text-sm text-slate-600">
            {latestDiary ? latestDiary.content : crop.memo}
          </p>

          {latestDiary?.workType === "수확" && latestDiary.harvestAmount && (
            <p className="mt-2 text-sm font-medium text-emerald-700">
              수확량: {latestDiary.harvestAmount}
            </p>
          )}
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {cropDiaries.length}건
        </span>
      </div>
    </div>
  );
}

function DiaryCard({ diary, deleteDiary, startEditDiary }) {
  const displayImageUrls =
    diary.imageUrls?.length > 0
      ? diary.imageUrls
      : diary.imageUrl
        ? [diary.imageUrl]
        : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {diary.authorMark && (
              <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-bold text-white">
                {"<<"}
                {diary.authorMark}
                {">>"}
              </span>
            )}

            <p className="text-sm text-slate-500">{diary.date}</p>
          </div>

          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {diary.crop} · {diary.workType}
          </h3>

          <p className="mt-2 text-sm text-slate-600">{diary.content}</p>

          {diary.workType === "수확" && diary.harvestAmount && (
            <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              수확량: {diary.harvestAmount}
            </p>
          )}

          {displayImageUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
              {displayImageUrls.map((imageUrl) => (
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt="농사일지 사진"
                  className="h-36 w-full rounded-2xl border border-slate-200 object-cover"
                />
              ))}
            </div>
          )}

          {diary.memo && (
            <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
              메모: {diary.memo}
            </p>
          )}

          {diary.updatedAt && (
            <p className="mt-2 text-xs text-slate-400">수정됨</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {diary.weather}
          </span>

          {startEditDiary && (
            <button
              type="button"
              onClick={() => startEditDiary(diary)}
              className="rounded-full px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              수정
            </button>
          )}

          {deleteDiary && (
            <button
              type="button"
              onClick={() => deleteDiary(diary.id)}
              className="rounded-full px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function EmptyBox({ message }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function SidebarNav({ activeTab, setActiveTab, currentUser, logoutUser }) {
  const tabs = [
    { id: "home", label: "홈" },
    { id: "write", label: "작성" },
    { id: "list", label: "목록" },
    { id: "crops", label: "작물" },
    ...(currentUser?.role === "admin" ? [{ id: "users", label: "사용자" }] : []),
  ];

  return (
    <>
      <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-500">현재 사용자</p>

        <p className="mt-1 text-lg font-bold text-slate-900">
          {"<<"}
          {currentUser.mark}
          {">>"} {currentUser.id}
        </p>

        <button
          type="button"
          onClick={logoutUser}
          className="mt-3 rounded-full text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          사용자 변경
        </button>
      </div>

      <nav className="space-y-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}

function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "home", label: "홈" },
    { id: "write", label: "작성" },
    { id: "list", label: "목록" },
    { id: "crops", label: "작물" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white px-3 py-2 md:hidden">
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-3 py-3 text-sm font-semibold ${
                isActive ? "bg-slate-900 text-white" : "text-slate-500"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function LoginScreen({ loginUser }) {
  const [userId, setUserId] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    loginUser(userId);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-slate-500">가족 농사일지</p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">로그인</h1>

        <p className="mt-2 text-sm text-slate-500">
          등록된 가족 아이디만 사용할 수 있습니다.
        </p>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            아이디
          </label>

          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value.toUpperCase())}
            placeholder="아이디 입력"
            autoFocus
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-slate-500"
          />

          <button
            type="submit"
            className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white"
          >
            로그인
          </button>
        </div>
      </form>
    </div>
  );
}

function UserManage({ users, addUser }) {
  const [userId, setUserId] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    addUser(userId);
    setUserId("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">사용자 관리</h2>
        <p className="mt-1 text-sm text-slate-500">
          관리자만 가족 아이디를 추가할 수 있습니다.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label className="text-sm font-semibold text-slate-700">
          새 사용자 아이디 추가
        </label>

        <div className="mt-3 flex flex-col gap-3 md:flex-row">
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value.toUpperCase())}
            placeholder="예: MIN"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-slate-500"
          />

          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            추가
          </button>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {"<<"}
                  {user.mark}
                  {">>"} {user.id}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  권한: {user.role === "admin" ? "관리자" : "사용자"}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {user.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
