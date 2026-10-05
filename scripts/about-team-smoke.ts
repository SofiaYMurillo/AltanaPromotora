import "dotenv/config";

import { prisma } from "../src/backend/db";
import {
  createAboutTeamMember,
  deleteAboutTeamMember,
  getPublicAboutTeamSection,
  updateAboutTeamMember,
  updateAboutTeamSection,
} from "../src/backend/services/about-team-service";
import {
  authenticateAdmin,
  authenticateWithInvitationCode,
} from "../src/backend/services/auth-service";
import {
  listEffectivePermissionNames,
  permissionDecision,
} from "../src/backend/services/authorize-service";
import { resolveAuthFromToken } from "../src/backend/services/session-service";
import {
  getAdminSeedPassword,
  getPrincipalAdminEmail,
} from "../src/backend/config/auth-config";
import { buildAboutPageData } from "../src/features/public/about/build-about-page-data";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const stamp = Date.now();
const adminEmail = getPrincipalAdminEmail();
const adminPassword = getAdminSeedPassword();

async function findImageAssetId() {
  const asset = await prisma.mediaAsset.findFirst({
    where: { kind: "image" },
    orderBy: { createdAt: "asc" },
  });
  return asset?.id ?? null;
}

async function main() {
  const createdMemberIds: string[] = [];
  let restoredSection: {
    title: string;
    description: string;
    pendingMessage: string;
  } | null = null;

  try {
    const publicBefore = await getPublicAboutTeamSection();
    assert(
      publicBefore.title.includes("ALTANA"),
      "case0: public section has default title",
    );
    assert(
      !publicBefore.title.includes("01 —"),
      "case0: no eyebrow in title",
    );

    const page = await buildAboutPageData();
    assert(page.equipo.title === publicBefore.title, "mapper: equipo from CMS");

    const visitorCtx = await resolveAuthFromToken(undefined);
    const visitorPerm = permissionDecision(visitorCtx, [], "page_content.manage");
    assert(
      !visitorPerm.ok && visitorPerm.status === 401,
      "security: unauthenticated 401",
    );

    const login = await authenticateAdmin({ email: adminEmail, password: adminPassword });
    if (!login.ok) {
      throw new Error("admin login failed");
    }
    const adminCtx = await resolveAuthFromToken(login.token);
    const adminPerms = await listEffectivePermissionNames(adminCtx.user!.id);
    const adminPerm = permissionDecision(
      adminCtx,
      adminPerms,
      "page_content.manage",
    );
    assert(adminPerm.ok, "security: admin has page_content.manage");

    const workerCode = process.env.WORKER_DEV_CODE_VALID?.trim() || "WORKER1A2B";
    const workerLogin = await authenticateWithInvitationCode({
      email: "worker@altana.test",
      code: workerCode,
    });
    if (workerLogin.ok) {
      const workerCtx = await resolveAuthFromToken(workerLogin.token);
      const workerPerms = await listEffectivePermissionNames(workerCtx.user!.id);
      const workerPage = permissionDecision(
        workerCtx,
        workerPerms,
        "page_content.manage",
      );
      assert(
        !workerPage.ok && workerPage.status === 403,
        "security: worker without page_content gets 403",
      );
    } else {
      console.log("security: SKIP worker permission (login failed)");
    }

    restoredSection = {
      title: publicBefore.title,
      description: publicBefore.description,
      pendingMessage: publicBefore.pendingMessage,
    };

    const newTitle = `Las personas detrás de ALTANA (${stamp})`;
    const u1 = await updateAboutTeamSection({
      title: newTitle,
      description: publicBefore.description,
      pendingMessage: publicBefore.pendingMessage,
    });
    assert(u1.ok, "case1: update title");
    const p1 = await getPublicAboutTeamSection();
    assert(p1.title === newTitle, "case1: public reflects title");

    const newDesc = `Descripción smoke ${stamp}`;
    const u2 = await updateAboutTeamSection({
      title: newTitle,
      description: newDesc,
      pendingMessage: publicBefore.pendingMessage,
    });
    assert(u2.ok, "case2: update description");
    assert(
      (await getPublicAboutTeamSection()).description === newDesc,
      "case2: public reflects description",
    );

    const newPending = `Pending smoke ${stamp}`;
    const u3 = await updateAboutTeamSection({
      title: newTitle,
      description: newDesc,
      pendingMessage: newPending,
    });
    assert(u3.ok, "case3: update pending");
    assert(
      (await getPublicAboutTeamSection()).pendingMessage === newPending,
      "case3: public reflects pending",
    );

    const mediaId = await findImageAssetId();
    if (!mediaId) {
      throw new Error("need image media asset for member tests");
    }

    const m1 = await createAboutTeamMember({
      name: `Smoke Member A ${stamp}`,
      role: "Cargo A",
      description: "Desc A",
      mediaAssetId: mediaId,
      sortOrder: 20,
      published: true,
    });
    if (!m1.ok) {
      throw new Error("case4: create published member failed");
    }
    createdMemberIds.push(m1.member.id);
    const memberA = m1.member;

    let pub = await getPublicAboutTeamSection();
    assert(
      pub.members.some((m) => m.name.includes("Smoke Member A")),
      "case4: member visible on public",
    );

    const unpublish = await updateAboutTeamMember(memberA.id, {
      name: memberA.name,
      role: memberA.role,
      description: memberA.description,
      mediaAssetId: memberA.mediaAssetId,
      sortOrder: memberA.sortOrder,
      published: false,
    });
    assert(unpublish.ok, "case5: unpublish");
    pub = await getPublicAboutTeamSection();
    assert(
      !pub.members.some((m) => m.id === memberA.id),
      "case5: unpublished hidden from public",
    );
    const stillThere = await prisma.aboutTeamMember.findUnique({
      where: { id: memberA.id },
    });
    assert(stillThere, "case5: member still in DB");

    const m2 = await createAboutTeamMember({
      name: `Smoke Member B ${stamp}`,
      role: "Cargo B",
      description: "Desc B",
      mediaAssetId: mediaId,
      sortOrder: 10,
      published: true,
    });
    if (!m2.ok) {
      throw new Error("case6: second member failed");
    }
    createdMemberIds.push(m2.member.id);
    const memberB = m2.member;

    await updateAboutTeamMember(memberA.id, {
      name: memberA.name,
      role: memberA.role,
      description: memberA.description,
      mediaAssetId: memberA.mediaAssetId,
      sortOrder: 30,
      published: true,
    });

    pub = await getPublicAboutTeamSection();
    assert(pub.members.length >= 2, "case6: two published members");
    const names = pub.members.map((m) => m.name);
    const idxB = names.findIndex((n) => n.includes("Smoke Member B"));
    const idxA = names.findIndex((n) => n.includes("Smoke Member A"));
    assert(idxB >= 0 && idxA >= 0 && idxB < idxA, "case6: sortOrder B before A");

    const altAsset = await prisma.mediaAsset.findFirst({
      where: { kind: "image", id: { not: mediaId } },
    });
    if (altAsset) {
      const swap = await updateAboutTeamMember(memberB.id, {
        name: memberB.name,
        role: memberB.role,
        description: memberB.description,
        mediaAssetId: altAsset.id,
        sortOrder: memberB.sortOrder,
        published: true,
      });
      assert(swap.ok, "case7: swap image");
      const withImg = await getPublicAboutTeamSection();
      const b = withImg.members.find((m) => m.name.includes("Smoke Member B"));
      assert(b?.image?.src === altAsset.url, "case7: public image updated");
    } else {
      console.log("case7: SKIP (only one image asset)");
    }

    await updateAboutTeamMember(memberA.id, {
      name: memberA.name,
      role: memberA.role,
      description: memberA.description,
      mediaAssetId: memberA.mediaAssetId,
      sortOrder: memberA.sortOrder,
      published: false,
    });
    const mNoPhoto = await createAboutTeamMember({
      name: `Smoke No Photo ${stamp}`,
      role: "Cargo sin foto",
      description: "",
      mediaAssetId: null,
      sortOrder: 40,
      published: true,
    });
    assert(mNoPhoto.ok, "case8b: create published member without image");
    if (mNoPhoto.ok) {
      createdMemberIds.push(mNoPhoto.member.id);
      pub = await getPublicAboutTeamSection();
      const noPhoto = pub.members.find((m) =>
        m.name.includes("Smoke No Photo"),
      );
      assert(noPhoto, "case8b: no-photo member on public list");
      assert(!noPhoto?.image, "case8b: image omitted when missing");
      await updateAboutTeamMember(mNoPhoto.member.id, {
        ...mNoPhoto.member,
        published: false,
      });
    }

    for (const id of createdMemberIds) {
      const row = await prisma.aboutTeamMember.findUnique({ where: { id } });
      if (!row) {
        continue;
      }
      await updateAboutTeamMember(id, {
        name: row.name,
        role: row.role,
        description: row.description,
        mediaAssetId: row.mediaAssetId,
        sortOrder: row.sortOrder,
        published: false,
      });
    }
    pub = await getPublicAboutTeamSection();
    assert(
      !pub.members.some((m) => m.name.includes(String(stamp))),
      "case8: smoke members not published",
    );
    assert(
      pub.pendingMessage === newPending,
      "case8: editorial pending from CMS",
    );

    console.log("about-team-smoke OK");
  } finally {
    for (const id of createdMemberIds) {
      await deleteAboutTeamMember(id).catch(() => undefined);
    }
    if (restoredSection) {
      await updateAboutTeamSection(restoredSection);
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
