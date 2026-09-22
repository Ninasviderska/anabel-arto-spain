import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Migas de pan" className="text-[0.7rem] tracking-[0.14em] uppercase text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={c.path}>
              {i > 0 && <ChevronRight className="size-3 opacity-60" aria-hidden />}
              <li>
                {last ? (
                  <span aria-current="page" className="text-foreground">
                    {c.name}
                  </span>
                ) : (
                  <Link to={c.path} className="hover:text-foreground">
                    {c.name}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
