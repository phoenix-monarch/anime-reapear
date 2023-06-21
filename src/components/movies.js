import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Card from "./cards";
import "./cards.css";
import Loading from "./loading/loading";
import Watch from "./watch/watch";

export default function Movies() {
  const [data, setData] = useState([]);
  const [moreLoad, setMoreLoad] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isBodySectionVisible, setIsBodySectionVisible] = useState(true); //for body section
  const [isFetched, setIsFetched] = useState(false);

  

  useEffect(() => {
    const itemsPath = document.querySelector(".itemsPath");
    itemsPath.children[0].addEventListener("click", () => {
      setIsBodySectionVisible(true);
    });
    const onMouseMove = (event) => {
      try {
        // Get the current mouse position
        const cardRect = event.currentTarget.getBoundingClientRect();
        const cardStyle = window.getComputedStyle(event.currentTarget);
        const cardPaddingLeft = parseFloat(cardStyle.paddingLeft);
        const cardPaddingTop = parseFloat(cardStyle.paddingTop);
        const cardPaddingRight = parseFloat(cardStyle.paddingRight);
        const cardPaddingBottom = parseFloat(cardStyle.paddingBottom);

        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const isMouseInside =
          mouseX >= cardRect.left + cardPaddingLeft &&
          mouseX <= cardRect.right - cardPaddingRight &&
          mouseY >= cardRect.top + cardPaddingTop &&
          mouseY <= cardRect.bottom - cardPaddingBottom;

        // Update the position and opacity of the overlay div
        const followMouse =
          event.currentTarget.querySelectorAll(".follow-mouse");
        followMouse.forEach((element) => {
          if (isMouseInside) {
            element.style.left = `${mouseX + 20}px`;
            element.style.top = `${mouseY}px`;
            element.style.display = "block";
          } else {
            element.style.display = "none";
          }
        });
      } catch (error) {
        console.log(error);
      }
    };

    const onMouseLeave = (event) => {
      // Hide the follow-mouse div when the mouse leaves the card
      const followMouse = event.currentTarget.querySelectorAll(".follow-mouse");
      followMouse.forEach((element) => {
        element.style.display = "none";
      });
    };
    const cards = document.querySelectorAll(".card")
    cards.forEach((card) => {
      card.addEventListener("mousemove", onMouseMove);
      card.addEventListener("mouseleave", onMouseLeave);
    });
  }, [data]);

  useEffect(() => {
    //loading first time!
    const loading = document.querySelector(".loadingData");
    // FETCH DATA

    async function fetchData() {
      try {
        setIsLoading(true);
        const allData = [];

        const response = await fetch(
          `https://api.jikan.moe/v4/top/anime?type=movie`
        );
        const json = await response.json();

        const promises = json.data.map((element, index) => {
          return new Promise(async (resolve) => {
            const response2 = await fetch(
              `https://austereenviousconstant.fishyflick.repl.co/getanime?mal_id=${element.mal_id}`
            );
            const json2 = await response2.json();
            if (json2[0] && json2[0].synopsis) {
              element.synopsis = json2[0].synopsis;
              allData.push(element);
            }

            resolve();
          });
        });

        await Promise.all(promises);

        setData(allData);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
        if (loading) {
          loading.style.display = "none";
        }
      }
    }

    fetchData();
  }, []);

  const fetchOther = async (page) => {
    try {
      const newData = [];
      const response = await fetch(
        `https://api.jikan.moe/v4/top/anime?type=movie&page=${page}` // use nextPage instead of moreLoad
      );
      const json = await response.json();
      const promises = json.data.map(async (element, index) => {
        return new Promise(async (resolve) => {
        const response2 = await fetch(
          `https://austereenviousconstant.fishyflick.repl.co/getanime?mal_id=${element.mal_id}`
        );
        const json2 = await response2.json();
        if (json2[0] && json2[0].synopsis) {
          element.synopsis = json2[0].synopsis;
        }

        const malIdExists = newData.some(
          (data) => data.mal_id === element.mal_id
        );
        if (!malIdExists && json2[0] && json2[0].mal_id === element.mal_id) {
          newData.push(element);
        }
        resolve();
      });
    });
      await Promise.all(promises);
      setData(newData);
      setIsFetched(false);
    } catch (error) {
      setIsFetched(false);
      console.log(error);
    }
  };

  const handleFetchPrev = () => {
    if (isFetched) {
      return;
    }
    let nextPage = moreLoad; // Get the updated value of page


    if (nextPage <= 1) {
      return;
    } else {
      nextPage = nextPage - 1;
    }
    setMoreLoad(nextPage); // Update page with the new value
    setIsFetched(true);
    fetchOther(nextPage); // Pass in the updated value to fetchOther
  };

  const handleFetchNext = () => {
    if (isFetched) {
      return;
    }

    const nextPage = moreLoad + 1; // Get the updated value of page
    setMoreLoad(nextPage); // Update page with the new value
    setIsFetched(true);
    fetchOther(nextPage); // Pass in the updated value to fetchOther
  };

  return (
    <div className="bodySection">
      {isBodySectionVisible ? (
        <div className="bodyContent">
          {!isLoading &&
            data.map((item) => {
              const key = item.id || item.mal_id; // check if key exists, else use id or mal_id
              return (
                <Card
                  key={key}
                  item={item}
                  setIsBodySectionVisible={setIsBodySectionVisible}
                  to={"movies"}
                />
              );
            })}
          {isLoading && <Loading />}
        </div>
      ) : (
        <Routes>
          <Route path="/watch/:title" element={<Watch />} />
        </Routes>
      )}

{isBodySectionVisible &&
        !isLoading &&
        (isFetched ? (
          <div className="loadMore disabled">
            <span>
              <i className="bx bxs-left-arrow"></i>
            </span>

            <span>
              <i className="bx bxs-right-arrow"></i>
            </span>
          </div>
        ) : (
          <div className="loadMore">
            <span
              onClick={() => {
                handleFetchPrev();
              }}
            >
              <i className="bx bxs-left-arrow"></i>
            </span>

            <span
              onClick={() => {
                handleFetchNext();
              }}
            >
              <i className="bx bxs-right-arrow"></i>
            </span>
          </div>
        ))}
    </div>
  );
}
