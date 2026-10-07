import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function cleanAndSetupProductionDatabase() {
  console.log("🧹 Cleaning demo/dummy data from database...");

  // 1. Delete all transactional / dummy demo data
  await prisma.timelineEvent.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.communication.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.universityCommission.deleteMany({});
  await prisma.visaChecklistItem.deleteMany({});
  await prisma.visaCase.deleteMany({});
  await prisma.studentDocument.deleteMany({});
  await prisma.travelRecord.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.student.deleteMany({});

  console.log("✅ All demo students, applications, payments, contracts, tasks, and documents removed!");

  // 2. Ensure Roles exist with full permissions
  const roles = [
    {
      name: "admin",
      displayName: "مشرف عام للنظام (Super Admin)",
      description: "صلاحيات كاملة وغير مقيدة لإدارة كافة فروع وعمليات النظام",
      isSystem: true,
      permissions: JSON.stringify(["*"]),
    },
    {
      name: "branch_manager",
      displayName: "مدير فرع (Branch Manager)",
      description: "إدارة العمليات والطلاب والموظفين داخل الفرع المحدد",
      isSystem: true,
      permissions: JSON.stringify(["branch:*", "students:*", "applications:*", "payments:*"]),
    },
    {
      name: "counselor",
      displayName: "مستشار تعليمي (Educational Counselor)",
      description: "متابعة الطلاب، تجهيز القبولات الجامعية، والتواصل مع الطلاب",
      isSystem: true,
      permissions: JSON.stringify(["students:read", "students:write", "applications:*", "tasks:*"]),
    },
    {
      name: "visa_officer",
      displayName: "مسؤول تأشيرات (Visa Officer)",
      description: "متابعة ملفات السفارات، مواعيد المقابلات، ومستندات التأشيرة",
      isSystem: true,
      permissions: JSON.stringify(["visa:*", "documents:*", "students:read"]),
    },
    {
      name: "accountant",
      displayName: "محاسب مالي (Financial Accountant)",
      description: "إصدار سندات القبض، متابعة العقود، وعمولات الجامعات الشريكة",
      isSystem: true,
      permissions: JSON.stringify(["payments:*", "contracts:*", "commissions:*", "students:read"]),
    },
  ];

  for (const r of roles) {
    const { permissions, ...roleData } = r;
    await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName, description: r.description },
      create: roleData,
    });
  }
  console.log("✅ Roles configured.");

  // 3. Ensure Default Branches exist
  const branches = [
    {
      code: "CAI-HQ",
      name: "المقر الرئيسي - القاهرة (Cairo HQ)",
      city: "القاهرة",
      country: "مصر",
      address: "مدينة نصر، شارع عباس العقاد، برج النور، الطابق 4",
      phone: "+20 100 234 5678",
      email: "cairo@amalon.com",
      isHeadquarter: true,
    },
    {
      code: "IST-01",
      name: "فرع إسطنبول (Istanbul Branch)",
      city: "إسطنبول",
      country: "تركيا",
      address: "شيشلي، مجيدية كوي، برج إسطنبول التجاري",
      phone: "+90 530 111 2233",
      email: "istanbul@amalon.com",
      isHeadquarter: false,
    },
    {
      code: "DXB-01",
      name: "فرع دبي (Dubai Branch)",
      city: "دبي",
      country: "الإمارات",
      address: "الخليج التجاري، برج أيريس باي، مكتب 802",
      phone: "+971 50 888 9900",
      email: "dubai@amalon.com",
      isHeadquarter: false,
    },
    {
      code: "BGD-01",
      name: "فرع بغداد (Baghdad Branch)",
      city: "بغداد",
      country: "العراق",
      address: "المنصور، شارع 14 رمضان، عمارة الرواد",
      phone: "+964 770 123 4567",
      email: "baghdad@amalon.com",
      isHeadquarter: false,
    },
  ];

  for (const b of branches) {
    await prisma.branch.upsert({
      where: { code: b.code },
      update: {
        name: b.name,
        city: b.city,
        country: b.country,
        address: b.address,
        phone: b.phone,
        email: b.email,
        isHeadquarter: b.isHeadquarter,
      },
      create: b,
    });
  }
  console.log("✅ Branches configured.");

  // 4. Ensure Super Admin Account exists
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const hqBranch = await prisma.branch.findUnique({ where: { code: "CAI-HQ" } });
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("admin123", salt);

  await prisma.user.upsert({
    where: { email: "admin@amalon.com" },
    update: {
      name: "المدير العام (System Admin)",
      roleId: adminRole!.id,
      branchId: hqBranch?.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: "المدير العام (System Admin)",
      email: "admin@amalon.com",
      passwordHash,
      phone: "+20 100 000 0000",
      roleId: adminRole!.id,
      branchId: hqBranch?.id,
      isActive: true,
    },
  });
  console.log("✅ Super Admin Account ready (admin@amalon.com / admin123).");

  // 5. Ensure Kanban Stages
  const stages = [
    { code: "lead", nameAr: "مرحلة التسجيل الأولي", nameEn: "Lead / Inquiry", color: "#94a3b8", order: 1 },
    { code: "consulting", nameAr: "الاستشارة واختيار التخصص", nameEn: "Consulting & Options", color: "#38bdf8", order: 2 },
    { code: "docs_ready", nameAr: "استكمال وتصديق الوثائق", nameEn: "Documents Ready", color: "#818cf8", order: 3 },
    { code: "applied", nameAr: "تم التقديم للجامعة", nameEn: "Applied to University", color: "#a855f7", order: 4 },
    { code: "conditional_offer", nameAr: "صدور القبول المبدئي", nameEn: "Conditional Offer", color: "#eab308", order: 5 },
    { code: "unconditional_offer", nameAr: "صدور القبول النهائي والرسمي", nameEn: "Unconditional Offer", color: "#22c55e", order: 6 },
    { code: "deposit_paid", nameAr: "سداد الرسوم للجامعة", nameEn: "Tuition Deposit Paid", color: "#14b8a6", order: 7 },
    { code: "visa_stage", nameAr: "إجراءات السفارة والتأشيرة", nameEn: "Visa Processing", color: "#f97316", order: 8 },
    { code: "visa_approved", nameAr: "صدور التأشيرة بنجاح", nameEn: "Visa Approved", color: "#10b981", order: 9 },
    { code: "enrolled", nameAr: "السفر وبدء الدراسة", nameEn: "Travel & Enrolled", color: "#065f46", order: 10 },
  ];

  for (const st of stages) {
    await prisma.kanbanStage.upsert({
      where: { slug: st.code },
      update: { nameAr: st.nameAr, nameEn: st.nameEn, color: st.color, order: st.order },
      create: {
        slug: st.code,
        nameAr: st.nameAr,
        nameEn: st.nameEn,
        color: st.color,
        order: st.order,
      },
    });
  }
  console.log("✅ Kanban Stages configured.");

  // 6. Ensure Core Lookups
  const lookups = [
    // study_level
    { category: "study_level", key: "bachelor", labelAr: "بكالوريوس", labelEn: "Bachelor's Degree", color: "#3b82f6", order: 1 },
    { category: "study_level", key: "master", labelAr: "ماجستير", labelEn: "Master's Degree", color: "#6366f1", order: 2 },
    { category: "study_level", key: "phd", labelAr: "دكتوراه", labelEn: "PhD / Doctorate", color: "#8b5cf6", order: 3 },
    { category: "study_level", key: "foundation", labelAr: "سنة تحضيرية", labelEn: "Foundation Year", color: "#ec4899", order: 4 },
    { category: "study_level", key: "language", labelAr: "دورة لغة أجنبية", labelEn: "Language Course", color: "#f59e0b", order: 5 },

    // student_status
    { category: "student_status", key: "new", labelAr: "طالب جديد", labelEn: "New Lead", color: "#64748b", order: 1 },
    { category: "student_status", key: "contacted", labelAr: "تم التواصل الأولي", labelEn: "Contacted", color: "#0284c7", order: 2 },
    { category: "student_status", key: "consultation_scheduled", labelAr: "جلسة استشارة محددة", labelEn: "Consultation Scheduled", color: "#0d9488", order: 3 },
    { category: "student_status", key: "contract_signed", labelAr: "تم توقيع العقد", labelEn: "Contract Signed", color: "#16a34a", order: 4 },
    { category: "student_status", key: "documents_collecting", labelAr: "جاري جمع الوثائق", labelEn: "Collecting Documents", color: "#ca8a04", order: 5 },
    { category: "student_status", key: "submitted", labelAr: "تم رفع التقديمات", labelEn: "Submitted", color: "#9333ea", order: 6 },
    { category: "student_status", key: "offer_received", labelAr: "استلم القبول", labelEn: "Offer Received", color: "#22c55e", order: 7 },
    { category: "student_status", key: "visa_approved", labelAr: "حصل على الفيزا", labelEn: "Visa Approved", color: "#059669", order: 8 },
    { category: "student_status", key: "arrived", labelAr: "سافر والتحق بالدراسة", labelEn: "Arrived & Enrolled", color: "#047857", order: 9 },

    // payment_method
    { category: "payment_method", key: "bank_transfer", labelAr: "تحويل بنكي", labelEn: "Bank Transfer", color: "#2563eb", order: 1 },
    { category: "payment_method", key: "cash", labelAr: "نقداً (كاش)", labelEn: "Cash", color: "#16a34a", order: 2 },
    { category: "payment_method", key: "card", labelAr: "بطاقة بنكية", labelEn: "Credit / Debit Card", color: "#9333ea", order: 3 },
    { category: "payment_method", key: "western_union", labelAr: "ويسترن يونيون", labelEn: "Western Union", color: "#ca8a04", order: 4 },
    { category: "payment_method", key: "check", labelAr: "شيك مصرفي", labelEn: "Bank Check", color: "#475569", order: 5 },

    // task_priority
    { category: "task_priority", key: "urgent", labelAr: "عاجل جداً", labelEn: "Urgent", color: "#dc2626", order: 1 },
    { category: "task_priority", key: "high", labelAr: "أولوية مرتفعة", labelEn: "High", color: "#ea580c", order: 2 },
    { category: "task_priority", key: "medium", labelAr: "أولوية متوسطة", labelEn: "Medium", color: "#2563eb", order: 3 },
    { category: "task_priority", key: "low", labelAr: "أولوية عادية", labelEn: "Low", color: "#64748b", order: 4 },
  ];

  for (const l of lookups) {
    await prisma.lookupOption.upsert({
      where: { category_key: { category: l.category, key: l.key } },
      update: { labelAr: l.labelAr, labelEn: l.labelEn, color: l.color, order: l.order },
      create: l,
    });
  }
  console.log("✅ Core Lookups configured.");

  // 7. Ensure Lead Sources
  const leadSources = [
    { code: "facebook", nameAr: "إعلانات فيسبوك", nameEn: "Facebook Ads", color: "#1877f2" },
    { code: "instagram", nameAr: "إنستغرام", nameEn: "Instagram Ads", color: "#e4405f" },
    { code: "tiktok", nameAr: "تيك توك", nameEn: "TikTok Ads", color: "#000000" },
    { code: "google_search", nameAr: "بحث جوجل وموقع الشركة", nameEn: "Google Search & Website", color: "#4285f4" },
    { code: "referral_student", nameAr: "توصية من طالب سابق", nameEn: "Student Referral", color: "#10b981" },
    { code: "education_fair", nameAr: "معارض الدراسة بالخارج", nameEn: "Education Fair", color: "#8b5cf6" },
    { code: "direct_visit", nameAr: "زيارة مباشرة لمكتب الشركة", nameEn: "Direct Office Walk-in", color: "#f59e0b" },
    { code: "agent_sub", nameAr: "وكيل فرعي خارجي", nameEn: "Sub-Agent Partner", color: "#6366f1" },
  ];

  for (const ls of leadSources) {
    await prisma.leadSource.upsert({
      where: { code: ls.code },
      update: { nameAr: ls.nameAr, nameEn: ls.nameEn, color: ls.color },
      create: ls,
    });
  }
  console.log("✅ Lead Sources configured.");

  console.log("🎉 Database Cleaned & Reset to Pure Production State!");
}

cleanAndSetupProductionDatabase()
  .catch((e) => {
    console.error("Setup error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
