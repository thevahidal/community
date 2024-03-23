import React, { useEffect, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef, //if using TypeScript (optional, but recommended)
} from "material-react-table";
import {
  Avatar,
  Box,
  Button,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import "./App.css";
import { useDebounce } from "use-debounce";

const GET_STARGAZERS = gql`
  query ($owner: String!, $repoName: String!, $endCursor: String) {
    repository(owner: $owner, name: $repoName) {
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
            url
            followers {
              totalCount
            }
            repositories(
              first: 1
              orderBy: { direction: DESC, field: STARGAZERS }
              ownerAffiliations: OWNER
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
  url: string;
}

function App() {
  const [repo, setRepo] = React.useState("thevahidal/soul");
  const [globalLoading, setGlobalLoading] = React.useState<boolean>(true);
  const [debouncedRepo] = useDebounce(repo, 1000);
  const { loading, error, data, fetchMore } = useQuery(GET_STARGAZERS, {
    variables: {
      endCursor: null,
      owner: debouncedRepo.split("/")[0],
      repoName: debouncedRepo.split("/")[1],
    },
  });

  const columns = useMemo<MRT_ColumnDef<Stargazer>[]>(
    () => [
      {
        accessorKey: "login",
        header: "Username",
        Cell: ({ cell }) => (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="flex-start"
          >
            <Avatar src={cell.row.original.avatarUrl} />
            <a href={cell.row.original.url} target="_blank">
              {cell.getValue<string>()}
            </a>
          </Stack>
        ),
      },
      {
        accessorKey: "followers",
        header: "Followers",
      },
      {
        accessorKey: "topRepo.name",
        header: "Top Starred Repo (TSR)",
        Cell: ({ cell }) => (
          <a
            href={cell.row.original.url + "/" + cell.getValue<string>()}
            target="_blank"
          >
            {cell.getValue<string>()}
          </a>
        ),
      },
      {
        id: "stargazers",
        accessorKey: "topRepo.stargazers",
        header: "TSR Stargazers",
      },
      {
        accessorKey: "topRepo.languages",
        header: "TSR Language",
      },
      {
        accessorKey: "topRepo.watchers",
        header: "TSR Watchers",
      },
      {
        accessorKey: "topRepo.forks",
        header: "TSR Forks",
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
        url: stargazer.node.url,
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
    initialState: {
      sorting: [
        {
          id: "stargazers", //sort by age by default on page load
          desc: true,
        },
      ],
    },
  });

  useEffect(() => {
    if (data?.repository?.stargazers?.pageInfo?.hasNextPage) {
      setGlobalLoading(true);
      fetchMore({
        query: GET_STARGAZERS,
        variables: {
          endCursor: data.repository.stargazers.pageInfo.endCursor,
          repoName: debouncedRepo.split("/")[1],
          owner: debouncedRepo.split("/")[0],
        },
        updateQuery,
      });
    } else {
      setGlobalLoading(false);
    }
  }, [data]);

  const updateQuery = (
    previousResult: { repository: { stargazers: any } },
    {
      fetchMoreResult,
    }: { fetchMoreResult: { repository: { stargazers: any } } },
  ) => {
    if (!fetchMoreResult) {
      return previousResult;
    }

    return {
      ...previousResult,
      repository: {
        ...previousResult.repository,
        stargazers: {
          ...previousResult.repository.stargazers,
          pageInfo: fetchMoreResult.repository.stargazers.pageInfo,
          edges: [
            ...previousResult.repository.stargazers.edges,
            ...fetchMoreResult.repository.stargazers.edges,
          ],
        },
      },
    };
  };

  return (
    <Container>
      <Stack pb={2}>
        <Typography variant="h5">Community</Typography>
        <Typography variant="subtitle2">
          Get your top starred stargazers!
        </Typography>
      </Stack>
      <Stack
        direction={"row"}
        pb={2}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Box
          component="form"
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
          }}
        >
          <TextField
            placeholder="owner/repo"
            name="repo"
            value={repo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setRepo(e.target.value);
              setGlobalLoading(true);
            }}
          />
        </Box>
        <Stack>{loading && <Typography>Loading...</Typography>}</Stack>
        <Stack>
          <Link href="https://github.com/thevahidal/community" target="_blank">
            <Typography>Github</Typography>
          </Link>
        </Stack>
      </Stack>
      <MaterialReactTable table={table} />
    </Container>
  );
}

export default App;
