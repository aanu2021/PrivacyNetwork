/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";
import "../styles/UserCard.css";
// import { useNavigate } from 'react-router-dom'

const BASE_API_URI = import.meta.env.VITE_BACKEND_URI;

import User from "../types/types";

interface UserCardProps {
  username: string;
  name: string;
  dpLink: string;
  currentUsername: string;
  user: User;
  curruser: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  fetchAllUserDetails: any;
  fetchCurrentUserDetails: any;
}
function UserCard({
  username,
  name,
  dpLink,
  currentUsername,
  user,
  curruser,
  users,
  setUsers,
  fetchAllUserDetails,
  fetchCurrentUserDetails,
}: UserCardProps) {
  // const navigate = useNavigate()

  const handleFollow = (id: string) => {
    fetch(`${BASE_API_URI}/api/follow`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify({
        userID: id,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        console.log(result);
        fetchAllUserDetails();
        fetchCurrentUserDetails();
        // const newUsers = users.filter((u) => u._id !== id);
        // setUsers(newUsers);
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      {currentUsername !== username &&
      curruser._id !== user._id &&
      curruser.friends.includes(user._id) === false ? (
        <div className="container usercard-container">
          <div className="card_item">
            <div className="card_inner">
              <img src={dpLink} alt="" />
              <div className="Name">{name}</div>
              <div className="userName">{username}</div>
              <div className="userUrl" />
              <div className="detail-box">
                <div className="gitDetail college-field">
                  <span>College</span>
                  {user.college ? user.college : "〰〰〰"}
                </div>
                <div className="gitDetail">
                  <span>Gender</span>
                  {user.gender ? user.gender : "〰〰〰"}
                </div>
                <div className="gitDetail">
                  <span>Age</span>
                  {user.age ? user.age : "〰〰〰"}
                </div>
              </div>
              <button
                type="button"
                className="addFriend"
                onClick={() => handleFollow(user._id)}
              >
                Add Friend
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default UserCard;
