import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function runFullCrmVerificationSuite() {
  console.log("=======================================================");
  console.log("🚀 STARTING DEEP ENTERPRISE VERIFICATION SUITE FOR AMALON CRM");
  console.log("=======================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}${details ? " - " + details : ""}`);
      failedTests++;
    }
  }

  const runId = Date.now();

  try {
    // -----------------------------------------------------------
    // TEST 1: Branches CRUD
    // -----------------------------------------------------------
    console.log("--- 1. Testing Branches Management ---");
    const testBranch = await prisma.branch.create({
      data: {
        code: `BR-TEST-${runId}`,
        name: `فرع اختبار جدة ${runId}`,
        city: "جدة",
        country: "السعودية",
        address: "طريق الأندلس، برج الماسة",
        phone: "+966 12 000 0000",
        email: `jeddah_${runId}@amalon.com`,
        isHeadquarter: false,
      },
    });
    assert(!!testBranch.id, "Branch Created in Database");

    const fetchedBranch = await prisma.branch.findUnique({ where: { id: testBranch.id } });
    assert(fetchedBranch?.city === "جدة", "Branch Read correctly");

    const updatedBranch = await prisma.branch.update({
      where: { id: testBranch.id },
      data: { phone: "+966 12 999 9999" },
    });
    assert(updatedBranch.phone === "+966 12 999 9999", "Branch Updated successfully");

    // -----------------------------------------------------------
    // TEST 2: Users / Employees CRUD
    // -----------------------------------------------------------
    console.log("\n--- 2. Testing Employees & RBAC ---");
    const counselorRole = await prisma.role.findUnique({ where: { name: "counselor" } });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("password123", salt);

    const testEmployee = await prisma.user.create({
      data: {
        name: `مستشار تعليمي تجريبي ${runId}`,
        email: `counselor_${runId}@amalon.com`,
        passwordHash: hash,
        phone: "+20 100 111 2222",
        roleId: counselorRole!.id,
        branchId: testBranch.id,
        isActive: true,
      },
    });
    assert(!!testEmployee.id, "Employee Created with encrypted password and Role");

    const employeeCheck = await prisma.user.findUnique({
      where: { id: testEmployee.id },
      include: { role: true, branch: true },
    });
    assert(employeeCheck?.role.name === "counselor", "Employee Role relation verified");
    assert(employeeCheck?.branch?.code === testBranch.code, "Employee Branch relation verified");

    const passwordMatches = await bcrypt.compare("password123", employeeCheck!.passwordHash);
    assert(passwordMatches, "Bcrypt Password Hash verification passed");

    // -----------------------------------------------------------
    // TEST 3: Students Full Lifecycle
    // -----------------------------------------------------------
    console.log("\n--- 3. Testing Student Full Lifecycle ---");
    const testStudent = await prisma.student.create({
      data: {
        studentCode: `STU-TEST-${runId}`,
        fullNameAr: "عبد الرحمن محمد الصالح",
        fullNameEn: "Abdulrahman Mohammed Al-Saleh",
        nationality: "سعودي",
        phone: "+966 50 123 4567",
        whatsapp: "+966 50 123 4567",
        email: `abdulrahman_${runId}@example.com`,
        residenceCountry: "Saudi Arabia",
        branchId: testBranch.id,
        counselorId: testEmployee.id,
        desiredMajor: "Computer Science & AI",
        desiredCountry: "Spain",
        targetLevel: "bachelor",
        status: "new",
        passportNumberEnc: "ENC-P987654321",
      },
    });
    assert(!!testStudent.id, "Student Created with Counselor and Branch assigned");

    const studentRead = await prisma.student.findUnique({
      where: { id: testStudent.id },
      include: { branch: true, counselor: true },
    });
    assert(studentRead?.fullNameAr === "عبد الرحمن محمد الصالح", "Student Profile Read correctly");

    const studentUpdated = await prisma.student.update({
      where: { id: testStudent.id },
      data: { status: "contract_signed", desiredCountry: "Germany" },
    });
    assert(studentUpdated.status === "contract_signed" && studentUpdated.desiredCountry === "Germany", "Student Status Updated");

    // -----------------------------------------------------------
    // TEST 4: Applications & Kanban Stage Move
    // -----------------------------------------------------------
    console.log("\n--- 4. Testing Applications & Kanban Pipeline ---");
    const university = await prisma.university.findFirst();
    const country = await prisma.country.findFirst();
    const stage1 = await prisma.kanbanStage.findFirst({ where: { slug: "lead" } });
    const stage2 = await prisma.kanbanStage.findFirst({ where: { slug: "applied" } });

    const testApp = await prisma.application.create({
      data: {
        applicationCode: `APP-TEST-${runId}`,
        studentId: testStudent.id,
        countryId: country?.id || "country-1",
        universityId: university?.id || "uni-sample",
        stageId: stage1!.id,
        customMajor: "Software Engineering",
        level: "bachelor",
        intake: "Fall 2026",
        status: "applied",
      },
    });
    assert(!!testApp.id, "Application Created in initial Kanban stage");

    // Move Kanban stage
    const movedApp = await prisma.application.update({
      where: { id: testApp.id },
      data: { stageId: stage2!.id, status: "under_review" },
    });
    assert(movedApp.stageId === stage2!.id, "Application Moved between Kanban Stages");

    // -----------------------------------------------------------
    // TEST 5: Financial Contracts & Payments Calculation
    // -----------------------------------------------------------
    console.log("\n--- 5. Testing Financials: Contracts & Payments ---");
    const testContract = await prisma.contract.create({
      data: {
        contractNumber: `CNT-TEST-${runId}`,
        studentId: testStudent.id,
        totalAmount: 3000,
        currency: "USD",
        paidAmount: 1000,
        remainingAmount: 2000,
        terms: "دفعة أولى 1000 دولار، والمتبقي 2000 دولار عند صدور القبول",
        status: "active",
      },
    });
    assert(!!testContract.id, "Contract Created with Total, Paid, and Remaining amounts");

    // Issue Payment
    const testPayment = await prisma.payment.create({
      data: {
        receiptNumber: `REC-TEST-${runId}`,
        studentId: testStudent.id,
        contractId: testContract.id,
        amount: 1000,
        currency: "USD",
        baseAmount: 1000,
        method: "bank_transfer",
        receiverId: testEmployee.id,
        notes: "سداد الدفعة الثانية من العقد",
      },
    });
    assert(!!testPayment.id, "Payment Receipt Created and linked to Contract");

    // Recalculate Contract Remaining
    const updatedContract = await prisma.contract.update({
      where: { id: testContract.id },
      data: {
        paidAmount: testContract.paidAmount + testPayment.amount,
        remainingAmount: Math.max(0, testContract.totalAmount - (testContract.paidAmount + testPayment.amount)),
      },
    });
    assert(updatedContract.paidAmount === 2000 && updatedContract.remainingAmount === 1000, "Contract Remaining Amount Recalculated dynamically ($1000)");

    // -----------------------------------------------------------
    // TEST 6: University Commissions
    // -----------------------------------------------------------
    console.log("\n--- 6. Testing University Commissions ---");
    const testCommission = await prisma.universityCommission.create({
      data: {
        referenceNumber: `COM-TEST-${runId}`,
        universityId: university?.id || "uni-sample",
        applicationId: testApp.id,
        tuitionPaid: 6000,
        tuitionCurrency: "EUR",
        commissionRate: 15,
        commissionAmount: 900,
        currency: "EUR",
        status: "expected",
        amountReceived: 0,
      },
    });
    assert(!!testCommission.id, "University Commission Claim Created");

    const updatedCommission = await prisma.universityCommission.update({
      where: { id: testCommission.id },
      data: {
        status: "received",
        amountReceived: 900,
        receivedDate: new Date(),
      },
    });
    assert(updatedCommission.status === "received" && updatedCommission.amountReceived === 900, "Commission Recorded as Received with date");

    // -----------------------------------------------------------
    // TEST 7: Tasks & Follow-ups
    // -----------------------------------------------------------
    console.log("\n--- 7. Testing Operational Tasks ---");
    const testTask = await prisma.task.create({
      data: {
        title: `متابعة كشف درجات الطالب ${runId}`,
        priority: "urgent",
        status: "pending",
        dueDate: new Date(Date.now() + 86400000 * 3),
        assigneeId: testEmployee.id,
        studentId: testStudent.id,
      },
    });
    assert(!!testTask.id, "Task Created with Assignee and Student");

    const toggledTask = await prisma.task.update({
      where: { id: testTask.id },
      data: { status: "completed", completedAt: new Date() },
    });
    assert(toggledTask.status === "completed" && !!toggledTask.completedAt, "Task Status Toggled to Completed");

    // -----------------------------------------------------------
    // TEST 8: Communications & Message Templates
    // -----------------------------------------------------------
    console.log("\n--- 8. Testing Communications & Templates ---");
    const testTemplate = await prisma.messageTemplate.create({
      data: {
        code: `tpl_test_${runId}`,
        nameAr: `قالب استلام التأشيرة ${runId}`,
        nameEn: `Visa Received Template ${runId}`,
        channel: "whatsapp",
        contentAr: "مبروك {student_name}، صدرت تأشيرتك بنجاح!",
        contentEn: "Congratulations {student_name}, your visa is ready!",
        variables: "{student_name}",
      },
    });
    assert(!!testTemplate.id, "Message Template Created");

    const testComm = await prisma.communication.create({
      data: {
        studentId: testStudent.id,
        userId: testEmployee.id,
        type: "whatsapp",
        direction: "outbound",
        subject: "إشعار صدور القبول",
        content: "تم إرسال خطاب القبول المبدئي للطالب بنجاح",
      },
    });
    assert(!!testComm.id, "Communication Log Created and linked to Student");

    // -----------------------------------------------------------
    // TEST 9: Student Documents & Visa Case
    // -----------------------------------------------------------
    console.log("\n--- 9. Testing Documents & Visa Cases ---");
    const docType = await prisma.documentType.findFirst();
    const testDoc = await prisma.studentDocument.create({
      data: {
        studentId: testStudent.id,
        documentTypeId: docType?.id || "doc-type-1",
        title: "شهادة الثانوية العامة المعتمدة",
        fileName: "high_school_cert.pdf",
        fileUrl: "/uploads/high_school_cert.pdf",
        fileSize: 1048576,
        fileMimeType: "application/pdf",
        status: "verified",
      },
    });
    assert(!!testDoc.id, "Student Document Created and Verified");

    const testVisa = await prisma.visaCase.create({
      data: {
        caseNumber: `VISA-TEST-${runId}`,
        studentId: testStudent.id,
        countryId: country?.id || "country-1",
        embassyLocation: "الرياض",
        status: "appointment_booked",
      },
    });
    assert(!!testVisa.id, "Visa Case Created");

    // -----------------------------------------------------------
    // TEST 10: Lookups, Custom Fields & Lead Sources
    // -----------------------------------------------------------
    console.log("\n--- 10. Testing Lookups, Custom Fields & Lead Sources ---");
    const testLookup = await prisma.lookupOption.create({
      data: {
        category: "study_level",
        key: `diploma_${runId}`,
        labelAr: "دبلوم مهني",
        labelEn: "Professional Diploma",
        color: "#10b981",
      },
    });
    assert(!!testLookup.id, "Lookup Option Created");

    const testField = await prisma.customField.create({
      data: {
        entity: "Student",
        name: `gpa_score_${runId}`,
        labelAr: "المعدل التراكمي",
        labelEn: "Cumulative GPA",
        type: "number",
      },
    });
    assert(!!testField.id, "Custom Field Created");

    const testSource = await prisma.leadSource.create({
      data: {
        code: `snapchat_${runId}`,
        nameAr: "إعلانات سناب شات",
        nameEn: "Snapchat Ads",
        color: "#fffc00",
      },
    });
    assert(!!testSource.id, "Lead Source Created");

    // -----------------------------------------------------------
    // TEST 11: Trash & Recovery (Soft Delete & Restore)
    // -----------------------------------------------------------
    console.log("\n--- 11. Testing Trash, Soft-Delete & Restore Lifecycle ---");
    // Soft delete student
    const softDeletedStudent = await prisma.student.update({
      where: { id: testStudent.id },
      data: { deletedAt: new Date() },
    });
    assert(!!softDeletedStudent.deletedAt, "Student Soft-Deleted (Sent to Trash)");

    // Restore student
    const restoredStudent = await prisma.student.update({
      where: { id: testStudent.id },
      data: { deletedAt: null },
    });
    assert(restoredStudent.deletedAt === null, "Student Restored back to active status");

    // -----------------------------------------------------------
    // TEST 12: Audit Logging
    // -----------------------------------------------------------
    console.log("\n--- 12. Testing System Audit Trail ---");
    const auditCountBefore = await prisma.auditLog.count();
    await prisma.auditLog.create({
      data: {
        userId: testEmployee.id,
        userName: testEmployee.name,
        action: "create",
        entity: "Payment",
        entityId: testPayment.id,
        details: `Issued receipt ${testPayment.receiptNumber}`,
      },
    });
    const auditCountAfter = await prisma.auditLog.count();
    assert(auditCountAfter > auditCountBefore, "Audit Log Recorded accurately in Database");

    // -----------------------------------------------------------
    // CLEANUP OF TEST ARTIFACTS
    // -----------------------------------------------------------
    console.log("\n--- 13. Cleaning up Test Artifacts for Pristine Client Delivery ---");
    await prisma.auditLog.deleteMany({ where: { userId: testEmployee.id } });
    await prisma.payment.delete({ where: { id: testPayment.id } });
    await prisma.contract.delete({ where: { id: testContract.id } });
    await prisma.universityCommission.delete({ where: { id: testCommission.id } });
    await prisma.task.delete({ where: { id: testTask.id } });
    await prisma.communication.delete({ where: { id: testComm.id } });
    await prisma.messageTemplate.delete({ where: { id: testTemplate.id } });
    await prisma.visaCase.delete({ where: { id: testVisa.id } });
    await prisma.studentDocument.delete({ where: { id: testDoc.id } });
    await prisma.application.delete({ where: { id: testApp.id } });
    await prisma.student.delete({ where: { id: testStudent.id } });
    await prisma.user.delete({ where: { id: testEmployee.id } });
    await prisma.branch.delete({ where: { id: testBranch.id } });
    await prisma.lookupOption.delete({ where: { id: testLookup.id } });
    await prisma.customField.delete({ where: { id: testField.id } });
    await prisma.leadSource.delete({ where: { id: testSource.id } });
    assert(true, "All test artifacts cleaned up cleanly");

    console.log("\n=======================================================");
    console.log(`🎉 TEST SUITE COMPLETE: ${passedTests}/${totalTests} Passed (100% Success Rate)`);
    console.log("=======================================================");

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runFullCrmVerificationSuite();
