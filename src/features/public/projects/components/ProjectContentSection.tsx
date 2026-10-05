import { ProjectImage } from "./ProjectImage";
import { ProjectSection } from "./ProjectSection";
import { ProjectSectionSubtitle } from "./ProjectSectionSubtitle";
import { ProjectText } from "./ProjectText";
import { ProjectTwoColumnSection } from "./ProjectTwoColumnSection";

type ProjectContentSectionProps = {
  title: string;
  subtitle?: string;
  image: {
    src: string;
    alt: string;
  };
  description: string;
};

export function ProjectContentSection({
  title,
  subtitle,
  image,
  description,
}: ProjectContentSectionProps) {
  return (
    <ProjectSection title={title}>
      {subtitle ? (
        <ProjectSectionSubtitle>
          {subtitle}
        </ProjectSectionSubtitle>
      ) : null}

      <ProjectTwoColumnSection
        image={
          <ProjectImage
            src={image.src}
            alt={image.alt}
          />
        }
        content={
          <ProjectText>
            {description}
          </ProjectText>
        }
      />
    </ProjectSection>
  );
}
