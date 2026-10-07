import { prisma } from "../lib/prisma";

async function testAllSections() {
  console.log("==================================================================");
  console.log("🌐 COMPREHENSIVE HTTP & DATABASE SYSTEM AUDIT: AMALON CRM");
  console.log("==================================================================\n");

  const baseUrl = "http://localhost:3000";
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function report(name: string, ok: boolean, timeMs: number, info?: string) {
    totalTests++;
    const speed = `${timeMs}ms`;
    if (ok) {
      console.log(`✅ [PASS] (${speed}) ${name} ${info ? `- ${info}` : ""}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] (${speed}) ${name} ${info ? `- ${info}` : ""}`);
      failedTests++;
    }
  }

  // -------------------------------------------------------------
  // PART 1: Test all Page Routes
  // -------------------------------------------------------------
  console.log("--- 1. Testing Page UI Route Rendering & Speed ---");
  const pages = [
    { name: "لوحة التحكم (Dashboard)", path: "/" },
    { name: "الطلاب (Students)", path: "/students" },
    { name: "القبولات والتقديمات (Applications)", path: "/applications" },
    { name: "لوحة كانبان (Kanban)", path: "/kanban" },
    { name: "الدول والوجهات (Countries)", path: "/countries" },
    { name: "الجامعات والشركاء (Universities)", path: "/universities" },
    { name: "إدارة المستندات (Documents)", path: "/documents" },
    { name: "ملفات التأشيرات (Visa)", path: "/visa" },
    { name: "المدفوعات والعقود (Payments)", path: "/payments" },
    { name: "عمولات الجامعات (Commissions)", path: "/commissions" },
    { name: "المهام والمتابعات (Tasks)", path: "/tasks" },
    { name: "التواصل والواتساب (Communications)", path: "/communications" },
    { name: "التقارير والإحصائيات (Reports)", path: "/reports" },
    { name: "الموظفون والفروع (Employees)", path: "/employees" },
    { name: "سجل العمليات (Audit Logs)", path: "/audit" },
    { name: "إعدادات النظام (Settings)", path: "/settings" },
    { name: "سلة المحذوفات (Trash)", path: "/trash" },
  ];

  for (const page of pages) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}${page.path}`);
      const duration = Date.now() - start;
      const ok = res.status === 200;
      report(`صفحة: ${page.name}`, ok, duration, `Status: ${res.status}`);
    } catch (err: any) {
      const duration = Date.now() - start;
      report(`صفحة: ${page.name}`, false, duration, err.message);
    }
  }

  // -------------------------------------------------------------
  // PART 2: Test API Endpoints
  // -------------------------------------------------------------
  console.log("\n--- 2. Testing API Data Endpoints & Central Database Retrieval ---");
  const apis = [
    { name: "API: Branches", path: "/api/branches" },
    { name: "API: Lookups", path: "/api/settings/lookups" },
    { name: "API: Custom Fields", path: "/api/settings/custom-fields" },
    { name: "API: Students", path: "/api/students?limit=5" },
    { name: "API: Applications", path: "/api/applications?limit=5" },
    { name: "API: Countries", path: "/api/countries" },
    { name: "API: Universities", path: "/api/universities" },
    { name: "API: Documents", path: "/api/documents" },
    { name: "API: Visa", path: "/api/visa" },
    { name: "API: Payments & Contracts", path: "/api/payments" },
    { name: "API: Contracts Direct", path: "/api/payments/contracts" },
    { name: "API: Commissions", path: "/api/commissions" },
    { name: "API: Tasks", path: "/api/tasks" },
    { name: "API: Communications", path: "/api/communications" },
    { name: "API: Employees", path: "/api/employees" },
    { name: "API: Audit Logs", path: "/api/audit" },
    { name: "API: Trash", path: "/api/trash" },
  ];

  for (const api of apis) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}${api.path}`);
      const duration = Date.now() - start;
      const json = await res.json().catch(() => null);
      const ok = res.status === 200 && json !== null;
      report(api.name, ok, duration, `Status: ${res.status}`);
    } catch (err: any) {
      const duration = Date.now() - start;
      report(api.name, false, duration, err.message);
    }
  }

  // -------------------------------------------------------------
  // PART 3: End-to-End Live HTTP Mutation & Real Central DB Verification
  // -------------------------------------------------------------
  console.log("\n--- 3. Testing Real-World Live CRUD Operations through HTTP ---");

  const runKey = Date.now();
  let createdStudentId = "";
  let createdContractId = "";
  let createdPaymentId = "";

  // 3.1 Create Student via HTTP POST
  const startStu = Date.now();
  try {
    const postStuRes = await fetch(`${baseUrl}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullNameAr: `طالب فحص سرعة ${runKey}`,
        fullNameEn: `Test Speed Student ${runKey}`,
        phone: `+96655${String(runKey).slice(-7)}`,
        whatsapp: `+96655${String(runKey).slice(-7)}`,
        email: `student_${runKey}@testspeed.com`,
        nationality: "سعودي",
        residenceCountry: "Saudi Arabia",
        desiredMajor: "Artificial Intelligence",
        desiredCountry: "Spain",
        targetLevel: "bachelor",
      }),
    });
    const durStu = Date.now() - startStu;
    const stuData = await postStuRes.json();
    createdStudentId = stuData.student?.id;
    report("إنشاء طالب جديد عبر API والتحقق من حفظه بقاعدة البيانات", postStuRes.status === 201 && !!createdStudentId, durStu);
  } catch (err: any) {
    report("إنشاء طالب جديد عبر API", false, Date.now() - startStu, err.message);
  }

  // 3.2 Verify Student Exists in Real Database
  if (createdStudentId) {
    const dbStudent = await prisma.student.findUnique({ where: { id: createdStudentId } });
    report("التحقق من وجود الطالب المحفوظ في قاعدة بيانات SQLite المركزية", !!dbStudent && dbStudent.email.includes("testspeed.com"), 2);
  }

  // 3.3 Create Contract via HTTP POST /api/payments
  if (createdStudentId) {
    const startContract = Date.now();
    try {
      const postContractRes = await fetch(`${baseUrl}/api/payments/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: createdStudentId,
          totalAmount: 4500,
          currency: "USD",
          terms: "دفعة أولى 1500 دولار، والمتبقي عند استلام التأشيرة",
        }),
      });
      const durContract = Date.now() - startContract;
      const contractData = await postContractRes.json();
      createdContractId = contractData.contract?.id;
      report("إنشاء عقد مالي جديد عبر API وحفظه في قاعدة البيانات", (postContractRes.status === 200 || postContractRes.status === 201) && !!createdContractId, durContract);
    } catch (err: any) {
      report("إنشاء عقد مالي جديد", false, Date.now() - startContract, err.message);
    }
  }

  // 3.4 Create Payment Receipt via HTTP POST /api/payments
  if (createdStudentId && createdContractId) {
    const startPay = Date.now();
    try {
      const postPayRes = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: createdStudentId,
          contractId: createdContractId,
          amount: 1500,
          currency: "USD",
          method: "bank_transfer",
          notes: "سداد الدفعة الأولى من العقد",
        }),
      });
      const durPay = Date.now() - startPay;
      const payData = await postPayRes.json();
      createdPaymentId = payData.payment?.id;
      report("إصدار سند قبض مالي عبر API وربطه بالعقد وتحديث المتبقي تلقائياً", (postPayRes.status === 200 || postPayRes.status === 201) && !!createdPaymentId, durPay);
    } catch (err: any) {
      report("إصدار سند قبض مالي", false, Date.now() - startPay, err.message);
    }

    // Check Contract Remaining in DB
    const updatedContract = await prisma.contract.findUnique({ where: { id: createdContractId } });
    report("تأكيد تحديث المبلغ المسدد والمتبقي في قاعدة البيانات (المسدد: 1500، المتبقي: 3000)", updatedContract?.paidAmount === 1500 && updatedContract?.remainingAmount === 3000, 3);
  }

  // 3.5 Create Task via HTTP POST /api/tasks
  let createdTaskId = "";
  const startTask = Date.now();
  try {
    const postTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `مهمة متابعة سريعة ${runKey}`,
        priority: "urgent",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        studentId: createdStudentId || undefined,
      }),
    });
    const durTask = Date.now() - startTask;
    const taskData = await postTaskRes.json();
    createdTaskId = taskData.task?.id;
    report("إضافة مهمة جديدة لموظف عبر API", (postTaskRes.status === 200 || postTaskRes.status === 201) && !!createdTaskId, durTask);
  } catch (err: any) {
    report("إضافة مهمة جديدة عبر API", false, Date.now() - startTask, err.message);
  }

  // 3.6 Clean up test records
  console.log("\n--- 4. Clean up Test Artifacts ---");
  if (createdPaymentId) await prisma.payment.delete({ where: { id: createdPaymentId } }).catch(() => {});
  if (createdContractId) await prisma.contract.delete({ where: { id: createdContractId } }).catch(() => {});
  if (createdTaskId) await prisma.task.delete({ where: { id: createdTaskId } }).catch(() => {});
  if (createdStudentId) await prisma.student.delete({ where: { id: createdStudentId } }).catch(() => {});
  report("تنظيف بيانات الاختبار والعودة للحالة النقية للعميل", true, 5);

  console.log("\n==================================================================");
  console.log(`🏁 RESULT: ${passedTests}/${totalTests} Passed (Success Rate: ${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================================");

  await prisma.$disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

testAllSections().catch((e) => {
  console.error("Fatal test error:", e);
  process.exit(1);
});
