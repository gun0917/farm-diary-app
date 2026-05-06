import { useState } from "react";

const defaultCrops = [
  { id: 1, name: "고추", memo: "비료 주기 확인 필요", lastWork: "물주기" },
  { id: 2, name: "토마토", memo: "지지대 확인", lastWork: "방제" },
  { id: 3, name: "상추", memo: "수확 가능", lastWork: "수확" },
];

const quickWorks = ["물주기", "비료", "방제", "수확"];
const workTypes = ["물주기", "비료", "파종", "정식", "방제", "수확", "기타"];
const weatherTypes = ["맑음", "흐림", "비", "눈", "바람 많음"];

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [editingDiary, setEditingDiary] = useState(null);

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

  const [diaries, setDiaries] = useState(() => {
    const savedDiaries = localStorage.getItem("farm-diaries");

    if (!savedDiaries) {
      return [];
    }

    try {
      return JSON.parse(savedDiaries);
    } catch {
      return [];
    }
  });

  function saveDiaries(nextDiaries) {
    setDiaries(nextDiaries);
    localStorage.setItem("farm-diaries", JSON.stringify(nextDiaries));
  }

  function saveCrops(nextCrops) {
    setCrops(nextCrops);
    localStorage.setItem("farm-crops", JSON.stringify(nextCrops));
  }

  function addDiary(newDiary) {
    const nextDiaries = [newDiary, ...diaries];
    saveDiaries(nextDiaries);
    setActiveTab("list");
  }
  function startEditDiary(diary) {
  setEditingDiary(diary);
  setActiveTab("write");
}

function updateDiary(updatedDiary) {
  const nextDiaries = diaries.map((diary) =>
    diary.id === updatedDiary.id ? updatedDiary : diary
  );

  saveDiaries(nextDiaries);
  setEditingDiary(null);
  setActiveTab("list");
}

function cancelEditDiary() {
  setEditingDiary(null);
  setActiveTab("list");
}

  function deleteDiary(id) {
    const isConfirmed = confirm("이 농사일지를 삭제할까요?");

    if (!isConfirmed) {
      return;
    }

    const nextDiaries = diaries.filter((diary) => diary.id !== id);
    saveDiaries(nextDiaries);
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

    const nextCrops = [...crops, newCrop];
    saveCrops(nextCrops);
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl bg-white">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 md:block">
          <div className="mb-8">
            <p className="text-sm text-slate-500">{today}</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              농사일지
            </h1>
          </div>

          <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 md:hidden">
            <p className="text-sm text-slate-500">{today}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              농사일지
            </h1>
          </header>

          <main className="flex-1 px-5 py-5 pb-24 md:px-8 lg:px-10">
            {activeTab === "home" && (
              <Dashboard
                setActiveTab={setActiveTab}
                diaries={diaries}
                crops={crops}
              />
            )}

            {activeTab === "write" && (
              <DiaryForm
                addDiary={addDiary}
                updateDiary={updateDiary}
                editingDiary={editingDiary}
                cancelEditDiary={cancelEditDiary}
                setActiveTab={setActiveTab}
                crops={crops}
              />
            )}

            {activeTab === "list" && (
              <DiaryList
                diaries={diaries}
                deleteDiary={deleteDiary}
                startEditDiary={startEditDiary}
                crops={crops}
              />
            )}

            {activeTab === "crops" && (
              <CropManage
                diaries={diaries}
                crops={crops}
                addCrop={addCrop}
              />
            )}
          </main>

          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </div>
  );
}

function Dashboard({ setActiveTab, diaries, crops }) {
  const recentDiaries = diaries.slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">오늘 작업을 빠르게 기록하세요</p>
        <h2 className="mt-2 text-xl font-semibold">오늘 농사일지 작성</h2>

        <button
          onClick={() => setActiveTab("write")}
          className="mt-5 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 md:w-auto md:px-8"
        >
          + 오늘 일지 작성하기
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            빠른 작업
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {quickWorks.map((work) => (
              <button
                key={work}
                onClick={() => setActiveTab("write")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm active:scale-[0.98]"
              >
                <span className="text-lg font-semibold text-slate-900">
                  {work}
                </span>
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
                <DiaryCard key={diary.id} diary={diary} />
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
}) {
  const firstCropName = crops.length > 0 ? crops[0].name : "";

  const [form, setForm] = useState({
    date: editingDiary ? editingDiary.date : new Date().toISOString().slice(0, 10),
    crop: editingDiary ? editingDiary.crop : firstCropName,
    workType: editingDiary ? editingDiary.workType : "물주기",
    weather: editingDiary ? editingDiary.weather : "맑음",
    content: editingDiary ? editingDiary.content : "",
    memo: editingDiary ? editingDiary.memo : "",
    harvestAmount: editingDiary ? editingDiary.harvestAmount || "" : "",
  });

  const isEditMode = Boolean(editingDiary);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.crop) {
      alert("작물을 먼저 추가해주세요.");
      return;
    }

    if (!form.content.trim()) {
      alert("작업 내용을 입력해주세요.");
      return;
    }

    if (isEditMode) {
      const updatedDiary = {
        ...editingDiary,
        ...form,
        updatedAt: new Date().toISOString(),
      };

      updateDiary(updatedDiary);
      return;
    }

    const newDiary = {
      id: Date.now(),
      ...form,
      createdAt: new Date().toISOString(),
    };

    addDiary(newDiary);

    setForm({
      date: new Date().toISOString().slice(0, 10),
      crop: firstCropName,
      workType: "물주기",
      weather: "맑음",
      content: "",
      memo: "",
      harvestAmount: "",
    });
  }

  function handleCancel() {
    if (isEditMode) {
      cancelEditDiary();
      return;
    }

    setActiveTab("home");
  }

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
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            rows="5"
            placeholder="예: 오전에 고추밭 물주기 완료"
            className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
          />
        </Field>

        <Field label="메모">
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

    const matchesCrop =
      cropFilter === "전체 작물" || diary.crop === cropFilter;

    const matchesWork =
      workFilter === "전체 작업" || diary.workType === workFilter;

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
        <p className="text-sm text-slate-500">
          총 {filteredDiaries.length}개의 기록
        </p>
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
        <label className="text-sm font-semibold text-slate-700">
          새 작물 추가
        </label>

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
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{diary.date}</p>

          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {diary.crop} · {diary.workType}
          </h3>

          <p className="mt-2 text-sm text-slate-600">{diary.content}</p>
          
          {diary.workType === "수확" && diary.harvestAmount && (
            <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              수확량: {diary.harvestAmount}
            </p>
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

        <div className="flex flex-col items-end gap-2">
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
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
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

function SidebarNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "home", label: "홈" },
    { id: "write", label: "작성" },
    { id: "list", label: "목록" },
    { id: "crops", label: "작물" },
  ];

  return (
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

export default App;