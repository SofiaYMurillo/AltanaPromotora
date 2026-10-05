export type TeamMemberImage = {
  src: string;
  alt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  description?: string;
  image?: TeamMemberImage;
};

export type TeamSectionData = {
  title: string;
  description: string;
  pendingMessage: string;
  members: readonly TeamMember[];
};
