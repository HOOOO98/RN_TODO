import { StatusBar } from 'expo-status-bar';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Vibration
} from 'react-native';
import { Fontisto } from "@expo/vector-icons";
import { theme } from './color';
import React, { useEffect, useState } from 'react';

const STORAGE_KEY = "@toDos";
const COMPLETED_KEY = "@completedToDos";

export default function App() {
  const [working, setWorking] = useState(true);
  const [text, setText] = useState("");
  const [toDos, setToDos] = useState({});
  const [editingToDoKey, setEditingToDoKey] = useState(null);
  const [editedToDoText, setEditedToDoText] = useState("");
  const [completedToDos, setCompletedToDos] = useState({});

  useEffect(() => {
    loadNav();
    loadToDos();
    loadCompletedToDos();
  }, []);

  useEffect(() => {
    saveCompletedToDos();
  }, [completedToDos]);

  const travel = () => {
    setWorking(false);
    saveNav(false);
  };
  const work = () => {
    setWorking(true);
    saveNav(true);
  };

  const onChangeText = (payload) => setText(payload);

  const toggleCompletedToDo = (key) => {
    if (completedToDos[key]) {
      const newCompletedToDos = { ...completedToDos };
      delete newCompletedToDos[key];
      setCompletedToDos(newCompletedToDos);
    } else {
      const newCompletedToDos = { ...completedToDos, [key]: true };
      setCompletedToDos(newCompletedToDos);
    }
  };

  const saveNav = async (isWorking) => {
    try {
      await AsyncStorage.setItem("navState", isWorking ? "working" : "travel");
    } catch (error) {
      console.error("Error saving navigation state: ", error);
    }
  };

  const loadNav = async () => {
    try {
      const navState = await AsyncStorage.getItem("navState");
      if (navState === "travel") {
        setWorking(false);
      } else {
        setWorking(true);
      }
    } catch (error) {
      console.error("Error loading navigation state: ", error);
    }
  };

  const editToDo = (key) => {
    Vibration.vibrate([10, 1]);
    setEditingToDoKey(key);
    setEditedToDoText(toDos[key].text);
  };

  const saveEditedToDo = (key) => {
    const newToDos = {
      ...toDos,
      [key]: { text: editedToDoText, working: toDos[key].working },
    };
    setToDos(newToDos);
    saveToDos(newToDos);
    setEditingToDoKey(null);
  };

  const saveToDos = async (toSave) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  };

  const loadToDos = async () => {
    try {
      const s = await AsyncStorage.getItem(STORAGE_KEY);
      if (s !== null) {
        setToDos(JSON.parse(s));
      }
    } catch (error) {
      console.error("Error loading todos: ", error);
    }
  };

  const saveCompletedToDos = async () => {
    try {
      await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(completedToDos));
    } catch (error) {
      console.error("Error saving completed todos: ", error);
    }
  };

  const loadCompletedToDos = async () => {
    try {
      const s = await AsyncStorage.getItem(COMPLETED_KEY);
      if (s !== null) {
        setCompletedToDos(JSON.parse(s));
      }
    } catch (error) {
      console.error("Error loading completed todos: ", error);
    }
  };

  const addToDo = async () => {
    if (text === "") {
      return;
    }
    const newToDos = {
      ...toDos,
      [Date.now()]: { text, working },
    }
    setToDos(newToDos);
    await saveToDos(newToDos);
    setText('');
  };

  const deleteToDo = (key) => {
    Alert.alert("Delete TO DO",
      "Are you sure you want to delete?",
      [
        { text: "Cancel" },
        {
          text: "Sure",
          style: "destructive",
          onPress: () => {
            const newToDos = { ...toDos };
            delete newToDos[key];
            setToDos(newToDos);
            saveToDos(newToDos);
          },
        },
      ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity onPress={work} >
          <Text style={{ ...styles.btnText, color: working ? "white" : theme.grey }}>Work</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={travel}>
          <Text style={{ ...styles.btnText, color: working ? theme.grey : "white" }}>Travel</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        onSubmitEditing={addToDo}
        onChangeText={onChangeText}
        value={text}
        returnKeyType='done'
        placeholder={working ? "Add a TODO!" : "Where do you want to go?"}
        style={styles.input} />
      <ScrollView>
        {Object.keys(toDos).map((key) => (
          toDos[key].working === working ? (
            <TouchableOpacity
              style={styles.toDo}
              key={key}
              onLongPress={() => editToDo(key)}
              onPress={() => toggleCompletedToDo(key)}>
              {editingToDoKey === key ? (
                <TextInput
                  style={styles.editInput}
                  value={editedToDoText}
                  onChangeText={(text) => setEditedToDoText(text)}
                  onBlur={() => saveEditedToDo(key)}
                />
              ) : (
                <Text
                  style={[
                    styles.toDoText,
                    completedToDos[key] && {
                      textDecorationLine: "line-through",
                      color: theme.grey
                    },
                  ]}>
                  {toDos[key].text}
                </Text>
              )}
              <TouchableOpacity onPress={() => deleteToDo(key)}>
                <Fontisto name="trash" size={18} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
          ) : null
        ))}
      </ScrollView>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 20,
  },
  header: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: 100,
  },
  btnText: {
    fontSize: 44,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginVertical: 20,
    fontSize: 18,
  },
  toDo: {
    backgroundColor: theme.toDoBg,
    marginBottom: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toDoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  editInput: {
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    color: "white",
  },
});
