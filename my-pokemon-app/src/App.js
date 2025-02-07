import "./App.css";
import { useState } from "react";
import Axios from "axios";

function App() {
  // Pokemon search variables
  const [pokemonName, setPokemonName] = useState("");
  const [validPokemon, setValidPokemon] = useState(null);
  const [validPokemonName, setValidPokemonName] = useState("");
  const [pokemon, setPokemon] = useState({
    name: "",
    type: [],
    img: "",
  });
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [damageRelations, setDamageRelations] = useState({
    zeroDamage: [],
    halfDamage: [],
    doubleDamage: [],
    quadDamage: [],
  });
  const [damageRelationsTo, setDamageRelationsTo] = useState({
    zeroDamageTo: [],
    halfDamageTo: [],
    doubleDamageTo: [],
  });

  const getTypeIcon = (type) => `/${type}.png`;

  // Search pokemon and validate
  const searchPokemon = () => {
    if (!pokemonName) {
      alert("Please enter a Pokémon name.");
      setValidPokemon(false);
      return;
    }
    Axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`)
      .then((response) => {
        console.log(response.data);
        setValidPokemonName(pokemonName);
        setValidPokemon(true);
        setSearchPerformed(true);
        setPokemon({
          name: pokemonName,
          type: response.data.types.map((typeObj) => typeObj.type.name),
          img: response.data.sprites.front_default,
        });

        const typeUrls = response.data.types.map((typeObj) => typeObj.type.url);

        const typePromises = typeUrls.map((url) => Axios.get(url));

        Promise.all(typePromises).then((responses) => {
          const damageRelations = responses.reduce(
            (acc, res) => {
              const doubleDamageFrom =
                res.data.damage_relations.double_damage_from.map(
                  (rel) => rel.name
                );
              const halfDamageFrom =
                res.data.damage_relations.half_damage_from.map(
                  (rel) => rel.name
                );
              const noDamageFrom = res.data.damage_relations.no_damage_from.map(
                (rel) => rel.name
              );

              return {
                doubleDamageFrom: [
                  ...acc.doubleDamageFrom,
                  ...doubleDamageFrom,
                ],
                halfDamageFrom: [...acc.halfDamageFrom, ...halfDamageFrom],
                noDamageFrom: [...acc.noDamageFrom, ...noDamageFrom],
              };
            },
            {
              doubleDamageFrom: [],
              halfDamageFrom: [],
              noDamageFrom: [],
            }
          );

          // Initialize multipliers
          const multipliers = {};

          damageRelations.doubleDamageFrom.forEach((type) => {
            multipliers[type] = (multipliers[type] || 1) * 2;
          });

          damageRelations.halfDamageFrom.forEach((type) => {
            multipliers[type] = (multipliers[type] || 1) * 0.5;
          });

          damageRelations.noDamageFrom.forEach((type) => {
            multipliers[type] = 0;
          });

          const zeroDamage = [];
          const halfDamage = [];
          const doubleDamage = [];
          const quadDamage = [];

          Object.entries(multipliers).forEach(([type, multiplier]) => {
            if (multiplier === 0) {
              zeroDamage.push(type);
            } else if (multiplier === 0.5) {
              halfDamage.push(type);
            } else if (multiplier === 2) {
              doubleDamage.push(type);
            } else if (multiplier === 4) {
              quadDamage.push(type);
            }
          });

          console.log("Damage Relations:", damageRelations);
          console.log("Type Multipliers:", multipliers);
          console.log("0x Damage Types:", zeroDamage);
          console.log("0.5x Damage Types:", halfDamage);
          console.log("2x Damage Types:", doubleDamage);
          console.log("4x Damage Types:", quadDamage);

          setDamageRelations({
            zeroDamage,
            halfDamage,
            doubleDamage,
            quadDamage,
          });

          const damageRelationsTo = responses.reduce(
            (acc, res) => {
              const doubleDamageTo =
                res.data.damage_relations.double_damage_to.map(
                  (rel) => rel.name
                );
              const halfDamageTo = res.data.damage_relations.half_damage_to.map(
                (rel) => rel.name
              );
              const noDamageTo = res.data.damage_relations.no_damage_to.map(
                (rel) => rel.name
              );

              return {
                doubleDamageTo: [...acc.doubleDamageTo, ...doubleDamageTo],
                halfDamageTo: [...acc.halfDamageTo, ...halfDamageTo],
                noDamageTo: [...acc.noDamageTo, ...noDamageTo],
              };
            },
            {
              doubleDamageTo: [],
              halfDamageTo: [],
              noDamageTo: [],
            }
          );

          // Arrays for priority-based sorting
          const zeroDamageTo = [];
          const halfDamageTo = [];
          const doubleDamageTo = [];

          // Helper function to prioritize types
          const addTypeWithPriority = (
            type,
            targetArray,
            lowerPriorityArrays
          ) => {
            // Remove the type from lower priority arrays
            lowerPriorityArrays.forEach((array) => {
              const index = array.indexOf(type);
              if (index !== -1) {
                array.splice(index, 1);
              }
            });

            // Add to the target array if not already there
            if (!targetArray.includes(type)) {
              targetArray.push(type);
            }
          };

          // Process noDamageFrom (highest priority)
          damageRelationsTo.noDamageTo.forEach((type) => {
            addTypeWithPriority(type, zeroDamageTo, [
              halfDamageTo,
              doubleDamageTo,
            ]);
          });

          // Process halfDamageFrom
          damageRelationsTo.halfDamageTo.forEach((type) => {
            addTypeWithPriority(type, halfDamageTo, [doubleDamageTo]);
          });

          // Process doubleDamageFrom (lowest priority)
          damageRelationsTo.doubleDamageTo.forEach((type) => {
            addTypeWithPriority(type, doubleDamageTo, []);
          });

          console.log("Damage Relations:", damageRelationsTo);
          console.log("0x Damage Types:", zeroDamageTo);
          console.log("0.5x Damage Types:", halfDamageTo);
          console.log("2x Damage Types:", doubleDamageTo);

          // Update state
          setDamageRelationsTo({
            zeroDamageTo,
            halfDamageTo,
            doubleDamageTo,
          });
        });
      })
      .catch((error) => {
        setValidPokemon(false);
        console.error("Error fetching Pokémon:", error);
        alert("Pokémon not found. Please try again.");
      });
  };

  return (
    <div className="App">
      <div className="TitleSection">
        <h1>PokeStats</h1>
      </div>
      <div className="Search">
        <input
          type="Search"
          onChange={(event) => setPokemonName(event.target.value)}
        />
        <button className="searchButton" onClick={searchPokemon}>
          Find Pokemon
        </button>
      </div>
      <div className="DisplaySection">
        <div className={`LeftSidebar ${searchPerformed ? "show-border" : ""}`}>
          <div className="Quad">
            {damageRelations.quadDamage.length > 0 && (
              <div>
                <h3>4x</h3>
                {damageRelations.quadDamage.map((type) => (
                  <img
                    src={`/${type}.png`}
                    alt={`${type} type`}
                    style={{ width: "60px", height: "30px" }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="Double">
            {damageRelations.doubleDamage.length > 0 && (
              <div>
                <h3>2x</h3>
                {damageRelations.doubleDamage.map((type) => (
                  <img
                    src={`/${type}.png`}
                    alt={`${type} type`}
                    style={{ width: "60px", height: "30px" }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="Half">
            {damageRelations.halfDamage.length > 0 && (
              <div>
                <h3>0.5x</h3>
                {damageRelations.halfDamage.map((type) => (
                  <img
                    src={`/${type}.png`}
                    alt={`${type} type`}
                    style={{ width: "60px", height: "30px" }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="Immune">
            {damageRelations.zeroDamage.length > 0 && (
              <div>
                <h3>Immune</h3>
                {damageRelations.zeroDamage.map((type) => (
                  <img
                    src={`/${type}.png`}
                    alt={`${type} type`}
                    style={{ width: "60px", height: "30px" }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="MainDisplay">
          {!validPokemon ? (
            <h1>Type Pokemon to Search</h1>
          ) : (
            <>
              <h1>
                {pokemon.name.charAt(0).toUpperCase() +
                  pokemon.name.slice(1).toLowerCase()}
              </h1>
              <img src={pokemon.img} alt={pokemon.name} />
              <div>
                {pokemon.type.map((type, index) => (
                  <img
                    key={index}
                    src={getTypeIcon(type)}
                    alt={`${type} icon`}
                    style={{
                      width: "60px",
                      height: "30px",
                      marginRight: "10px",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className={`RightSidebar ${searchPerformed ? "show-border" : ""}`}>
          <div className="Double">
            {damageRelationsTo.doubleDamageTo.length > 0 && (
              <div>
                <h3>2x</h3>
                {damageRelationsTo.doubleDamageTo.map((type) => (
                  <img
                    src={`/${type}.png`}
                    alt={`${type} type`}
                    style={{ width: "60px", height: "30px" }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="Half">
            {damageRelationsTo.halfDamageTo.length > 0 && (
              <div>
                <h3>0.5x</h3>
                {damageRelationsTo.halfDamageTo.map((type) => (
                  <img
                    src={`/${type}.png`}
                    alt={`${type} type`}
                    style={{ width: "60px", height: "30px" }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="Immune">
            {damageRelationsTo.zeroDamageTo.length > 0 && (
              <div>
                <h3>Immune</h3>
                {damageRelationsTo.zeroDamageTo.map((type) => (
                  <img
                    src={`/${type}.png`}
                    alt={`${type} type`}
                    style={{ width: "60px", height: "30px" }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
