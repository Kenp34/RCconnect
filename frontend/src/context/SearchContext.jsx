import { createContext, useContext, useState,  } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const SearchContext=createContext();
export const SearchProvider=({children})=>{
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState(null); // null = pas de recherche active
const [searching, setSearching] = useState(false);
const token = localStorage.getItem("token")




const handleSearch = async (e) => {
  const value = e.target.value;
  setSearchQuery(value);
  console.log(value)

  if (!value.trim()) {
    setSearchResults(null); // revient au feed normal
    return;
  }

  setSearching(true);
  try {
    const { data } = await axios.get(`${API}/posts/search`, {
      params: { q: value },
      headers: { Authorization: `Bearer ${token}` }
    });
    setSearchResults(data);
    console.log(data)
  } catch (err) {
    console.error('Erreur recherche:', err);
  } finally {
    setSearching(false);
  }
};

return(
    <SearchContext.Provider value={{searchQuery,searchResults,searching,handleSearch}}>
         {children}
    </SearchContext.Provider>
)
}

export const useSearch = () =>useContext(SearchContext)