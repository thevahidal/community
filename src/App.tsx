import { useEffect, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef, //if using TypeScript (optional, but recommended)
} from "material-react-table";

import "./App.css";

const GET_STARGAZERS = gql`
  query ($endCursor: String) {
    repository(owner: "thevahidal", name: "soul") {
      stargazers(
        first: 100
        orderBy: { direction: ASC, field: STARRED_AT }
        after: $endCursor
      ) {
        pageInfo {
          endCursor
          startCursor
          hasNextPage
          hasPreviousPage
        }
        edges {
          node {
            id
            login
            avatarUrl
            followers {
              totalCount
            }
            repositories(
              first: 1
              orderBy: { direction: DESC, field: STARGAZERS }
            ) {
              edges {
                node {
                  name
                  languages(first: 1) {
                    edges {
                      node {
                        name
                      }
                    }
                  }
                  stargazers {
                    totalCount
                  }
                  watchers {
                    totalCount
                  }
                  forks {
                    totalCount
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface Repo {
  name: string;
  languages: string;
  stargazers: number;
  watchers: number;
  forks: number;
}

interface Stargazer {
  id: string;
  login: string;
  avatarUrl: string;
  followers: number;
  topRepo: Repo;
}

function App() {
  const { loading, error, data, fetchMore } = useQuery(GET_STARGAZERS, {
    variables: {
      endCursor: null,
    },
  });

  const columns = useMemo<MRT_ColumnDef<Stargazer>[]>(
    () => [
      {
        accessorKey: "avatarUrl",
        header: "Avatar",
        Cell: ({ cell }) => (
          <img src={cell.getValue<string>()} style={{ width: 50 }} />
        ),
      },
      {
        accessorKey: "login",
        header: "Username",
      },
      {
        accessorKey: "followers",
        header: "Followers",
      },
      {
        accessorKey: "topRepo.name",
        header: "Top Repo",
      },
      {
        accessorKey: "topRepo.languages",
        header: "Languages",
      },
      {
        accessorKey: "topRepo.stargazers",
        header: "Stargazers",
      },
      {
        accessorKey: "topRepo.watchers",
        header: "Watchers",
      },
      {
        accessorKey: "topRepo.forks",
        header: "Forks",
      },
    ],
    [],
  );

  const cleanedData = useMemo<Stargazer[]>(() => {
    return data?.repository?.stargazers?.edges
      ?.map((stargazer: any) => ({
        id: stargazer.node.id,
        login: stargazer.node.login,
        avatarUrl: stargazer.node.avatarUrl,
        followers: stargazer.node.followers.totalCount,
        topRepo: {
          name: stargazer.node.repositories.edges[0]?.node.name,
          languages:
            stargazer.node.repositories.edges[0]?.node.languages.edges[0]?.node
              .name,
          stargazers:
            stargazer.node.repositories.edges[0]?.node.stargazers.totalCount,
          watchers:
            stargazer.node.repositories.edges[0]?.node.watchers.totalCount,
          forks: stargazer.node.repositories.edges[0]?.node.forks.totalCount,
        },
      }))
      .filter((stargazer: Stargazer) => stargazer.topRepo.name);
  }, [data]);

  const table = useMaterialReactTable({
    columns,
    data: cleanedData || [],
    enableColumnOrdering: true,
  });

  useEffect(() => {
    if (data?.repository?.stargazers?.pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          endCursor: data.repository.stargazers.pageInfo.endCursor,
        },
        updateQuery,
      });
    }
  }, [data?.repository.stargazers?.pageInfo?.endCursor]);

  console.log(cleanedData?.length);
  console.log(data?.repository?.stargazers?.pageInfo?.hasNextPage);

  const updateQuery = (
    previousResult: { repository: { stargazers: any } },
    { nextResult }: { nextResult: { repository: { stargazers: any } } },
  ) => {
    if (!nextResult) {
      return previousResult;
    }

    return {
      ...previousResult,
      repository: {
        ...previousResult.repository,
        stargazers: {
          ...previousResult.repository.stargazers,
          pageInfo: nextResult.repository.stargazers.pageInfo,
          edges: [
            ...previousResult.repository.stargazers.edges,
            ...nextResult.repository.stargazers.edges,
          ],
        },
      },
    };
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <MaterialReactTable table={table} />
    </>
  );
}

export default App;
