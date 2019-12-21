import React, { useEffect } from "react";
import styled from "styled-components";

const Main = styled.main`
  height: 100%;
`;

const Container = styled.div`
  padding-top: 60px;
  margin: auto;
`;
const Wrapper = styled.section``;
const ContentBox = styled.div`
  .images {
    max-width: 100%;
  }

  .image {
    display: inline-block;
    position: absolute;
    padding: 10px;
  }

  .image > img {
    width: 100%;
  }
`;
const HomePresenter = () => {
  const masonry = () => {
    let images = document.querySelectorAll(".image");
    let width = document.querySelector("section").getBoundingClientRect().width;

    let imgStack = [
      Math.floor(Math.random() * 2),
      Math.floor(Math.random() * 2),
      Math.floor(Math.random() * 2),
      Math.floor(Math.random() * 2)
    ];
    let colWidth;

    for (let i = 0; i < images.length; i++) {
      colWidth = Math.floor(width / imgStack.length);
      images[i].style.width = `${colWidth}px`;
      let minIndex = imgStack.indexOf(Math.min.apply(0, imgStack));
      let x = colWidth * minIndex;
      let y = imgStack[minIndex];
      imgStack[minIndex] += images[i].children[0].height + 20;
      console.log(
        minIndex,
        "x : " + x,
        "y : " + y,
        imgStack,
        images[0].children[0].height
      );
      images[i].style.transform = `translateX(${x}px) translateY(${y}px)`;
      setTimeout(() => {
        if (i === images.length - 1) {
          document.querySelector(".images").style.height = `${Math.max.apply(
            0,
            imgStack
          ) + 20}px`;
        }
      }, 100);
    }
  };

  useEffect(() => {
    window.addEventListener("load", masonry);
    masonry();

    return () => window.removeEventListener("load", masonry);
    masonry();
  }, []);

  return (
    <Main>
      <Container>
        <Wrapper>
          <ContentBox>
            <div className="images">
              <div className="image">
                <img
                  src="https://images.unsplash.com/photo-1552633832-4f5a1b110980?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjYxOTE2fQ"
                  alt=""
                />
                <span>0</span>
              </div>
              <div className="image">
                <img
                  src="https://images.unsplash.com/photo-1552584010-ca8bbbd5bd18?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjYxOTE2fQ"
                  alt=""
                />
                <span>1</span>
              </div>
              <div className="image">
                <img
                  src="https://images.unsplash.com/photo-1552644867-3c98a63f38eb?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjYxOTE2fQ"
                  alt=""
                />
                <span>2</span>
              </div>
              <div className="image">
                <img
                  src="https://images.unsplash.com/photo-1552620543-31d952829801?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjYxOTE2fQ"
                  alt=""
                />
                <span>3</span>
              </div>
              <div className="image">
                <img
                  src="https://images.unsplash.com/photo-1552602989-715150494024?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjYxOTE2fQ"
                  alt=""
                />
                <span>4</span>
              </div>
              <div className="image">
                <img src={require("../../assets/img/nolec.png")} />
                <span>5</span>
              </div>
              <div className="image">
                <img src={require("../../assets/img/test.png")} />
                <span>6</span>
              </div>
              <div className="image">
                <img src={require("../../assets/img/test.png")} />
                <span>7</span>
              </div>
            </div>
          </ContentBox>
        </Wrapper>
      </Container>
    </Main>
  );
};

export default HomePresenter;
