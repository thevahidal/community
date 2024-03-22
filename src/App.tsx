import { useMemo, useState } from "react";
import { useQuery, gql } from "@apollo/client";

import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

const GET_STARGAZERS = gql`
  query {
    repository(owner: "thevahidal", name: "soul") {
      stargazers(first: 100, orderBy: { direction: DESC, field: STARRED_AT }) {
        edges {
          node {
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

function App() {
  const { loading, error, data } = useQuery(GET_STARGAZERS);

  const cleanedData = useMemo(() => {
    return data?.repository?.stargazers?.edges
      ?.map((stargazer: any) => ({
        login: stargazer.node.login,
        avatarUrl: stargazer.node.avatarUrl,
        followers: stargazer.node.followers.totalCount,
        topRepoName: stargazer.node.repositories.edges[0]?.node.name,
        topRepoLanguage:
          stargazer.node.repositories.edges[0]?.node.languages.edges[0]?.node
            .name,
        topRepoStargazers:
          stargazer.node.repositories.edges[0]?.node.stargazers.totalCount,
        topRepoWatchers:
          stargazer.node.repositories.edges[0]?.node.watchers.totalCount,
        topRepoForks:
          stargazer.node.repositories.edges[0]?.node.forks.totalCount,
      }))
      .sort((a: any, b: any) => b.topRepoStargazers - a.topRepoStargazers);
  }, [data]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return (
    <>
      {cleanedData?.map((stargazer: any) => {
        return (
          <div key={stargazer.login}>
            <img
              src={stargazer.avatarUrl}
              alt={stargazer.login}
              style={{
                width: 50,
              }}
            />
            <h3>{stargazer.login}</h3>
            <p>Followers: {stargazer.followers}</p>
            <p>
              Top Repo: {stargazer.topRepoName} - Stars:{" "}
              {stargazer.topRepoStargazers} - Watchers:{" "}
              {stargazer.topRepoWatchers} - Language:{" "}
              {stargazer.topRepoLanguage} - Forks: {stargazer.topRepoForks}
            </p>
          </div>
        );
      })}
    </>
  );
}

export default App;
